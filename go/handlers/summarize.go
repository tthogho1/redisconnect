package handlers

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
)

const (
	summarizeUpstreamURL = "https://tthogho1-summarizewiki.hf.space/summarize"
	maxRequestItems      = 5
)

// SummarizeRequest represents a single item in the request array
type SummarizeRequest struct {
	URL          string `json:"url"`
	TargetTokens int    `json:"target_tokens"`
}

// Summarize forwards a JSON array to the HuggingFace summarize endpoint
func Summarize(c *gin.Context) {
	start := time.Now()
	log.Printf("📥 [/summarize] Request received from %s", c.ClientIP())

	// Parse the JSON array from the request body
	var requests []SummarizeRequest
	if err := c.ShouldBindJSON(&requests); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid JSON: " + err.Error()})
		return
	}

	// Validate array length
	if len(requests) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "request array must not be empty"})
		return
	}
	if len(requests) > maxRequestItems {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": fmt.Sprintf("request array length must be %d or less, got %d", maxRequestItems, len(requests)),
		})
		return
	}

	// Log request details
	for i, r := range requests {
		log.Printf("📝 [/summarize] Item[%d]: url=%s, target_tokens=%d", i, r.URL, r.TargetTokens)
	}

	// Marshal the request to forward upstream
	body, err := json.Marshal(requests)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to marshal request: " + err.Error()})
		return
	}

	// Create HTTP request to the upstream summarize service
	httpClient := &http.Client{Timeout: 120 * time.Second}
	req, err := http.NewRequestWithContext(c.Request.Context(), http.MethodPost, summarizeUpstreamURL, bytes.NewReader(body))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create upstream request: " + err.Error()})
		return
	}
	req.Header.Set("Content-Type", "application/json")

	// Execute the upstream request
	log.Printf("🔄 [/summarize] Forwarding %d items to upstream", len(requests))
	resp, err := httpClient.Do(req)
	if err != nil {
		elapsed := time.Since(start)
		log.Printf("❌ [/summarize] Upstream request failed after %s: %s", elapsed, err.Error())
		c.JSON(http.StatusBadGateway, gin.H{"error": "upstream request failed: " + err.Error()})
		return
	}
	defer resp.Body.Close()

	// Read the upstream response body
	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		c.JSON(http.StatusBadGateway, gin.H{"error": "failed to read upstream response: " + err.Error()})
		return
	}

	elapsed := time.Since(start)

	// If upstream returned an error status, forward it
	if resp.StatusCode != http.StatusOK {
		log.Printf("⚠️ [/summarize] Upstream returned status %d after %s", resp.StatusCode, elapsed)
		c.Data(resp.StatusCode, "application/json", respBody)
		return
	}

	// Return the upstream JSON array response as-is
	log.Printf("✅ [/summarize] Response completed: %d items, status=%d, elapsed=%s", len(requests), resp.StatusCode, elapsed)
	c.Data(http.StatusOK, "application/json", respBody)
}
