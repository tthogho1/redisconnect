package models

// ChatMessage represents a chat message
type ChatMessage struct {
	Type      string `json:"type"`
	From      string `json:"from"`
	FromName  string `json:"from_name"`
	To        string `json:"to,omitempty"`
	Message   string `json:"message"`
	Timestamp string `json:"timestamp,omitempty"`
}
