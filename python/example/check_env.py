import redis
from dotenv import load_dotenv
import os

load_dotenv(override=True)

HOST = os.getenv("HOST")
PORT = int(os.getenv("PORT"))
REDIS_USERNAME = os.getenv("REDIS_USERNAME")
PASSWORD = os.getenv("PASSWORD")

pool = redis.ConnectionPool(
    host=HOST,
    port=PORT,
    decode_responses=True,
    username=REDIS_USERNAME,
    password=PASSWORD,
    max_connections=10,
)

r = redis.Redis(connection_pool=pool)

print("Redis connection successful.")
