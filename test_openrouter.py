import os
import json
import requests
from dotenv import load_dotenv

load_dotenv()

api_key = os.getenv("OPEN_ROUTER_KEY")
print(f"API Key exists: {bool(api_key)}")

models_to_try = [
    "google/gemini-flash-1.5",
    "google/gemini-2.0-flash-exp:free",
    "google/gemini-flash-1.5-8b",
    "google/gemini-1.5-flash",
]

for model in models_to_try:
    print(f"\nTrying model: {model}")
    try:
        response = requests.post(
            url="https://openrouter.ai/api/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
            data=json.dumps({
                "model": model,
                "messages": [{"role": "user", "content": "Hi"}],
            }),
            timeout=10
        )
        print(f"Status Code: {response.status_code}")
        if response.status_code == 200:
            print("SUCCESS!")
            break
        else:
            print(f"Error: {response.text}")
    except Exception as e:
        print(f"Failed: {str(e)}")
