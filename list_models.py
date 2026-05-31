import os
import json
import requests
from dotenv import load_dotenv

load_dotenv()

api_key = os.getenv("OPEN_ROUTER_KEY")

# Try to get models list first
try:
    response = requests.get("https://openrouter.ai/api/v1/models")
    if response.status_code == 200:
        models = response.json()['data']
        # Filter for gemini models
        gemini_models = [m['id'] for m in models if 'gemini' in m['id'].lower()]
        print(f"Available Gemini models: {gemini_models[:10]}")
    else:
        print(f"Failed to get models: {response.text}")
except Exception as e:
    print(f"Error getting models: {e}")

model = "google/gemini-flash-1.5" # Let's try to be very specific if we found one
