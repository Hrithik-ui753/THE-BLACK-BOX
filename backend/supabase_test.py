import os
from pathlib import Path

from dotenv import load_dotenv
from supabase import create_client

# Load .env from the same folder as this Python file
env_path = Path(__file__).resolve().parent / ".env"
load_dotenv(env_path)

url = os.getenv("SUPABASE_URL")
key = os.getenv("SUPABASE_SECRET_KEY")

print("URL:", url)
print("KEY FOUND:", bool(key))

if not url:
    raise ValueError("SUPABASE_URL is missing")

if not key:
    raise ValueError("SUPABASE_SECRET_KEY is missing")

supabase = create_client(url, key)

print("SUPABASE CONNECTED")