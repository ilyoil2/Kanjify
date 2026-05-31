import os
import json
import requests
from dotenv import load_dotenv

load_dotenv()

try:
    response = requests.get("https://openrouter.ai/api/v1/models")
    if response.status_code == 200:
        models = response.json()['data']
        gemini_models = [m['id'] for m in models if 'gemini' in m['id'].lower()]
        for m in sorted(gemini_models):
            print(m)
    else:
        print(f"Failed to get models: {response.text}")
except Exception as e:
    print(f"Error getting models: {e}")
