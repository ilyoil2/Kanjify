import requests
import json

try:
    response = requests.get("https://openrouter.ai/api/v1/models")
    if response.status_code == 200:
        models = response.json()['data']
        free_models = []
        for m in models:
            # Check for :free suffix or zero pricing
            is_free_id = ":free" in m['id']
            pricing = m.get('pricing', {})
            is_zero_price = pricing.get('prompt') == "0" and pricing.get('completion') == "0"
            
            if is_free_id or is_zero_price:
                free_models.append({
                    'id': m['id'],
                    'name': m.get('name'),
                    'pricing': pricing
                })
        
        print("--- AVAILABLE FREE MODELS ---")
        for fm in free_models:
            print(f"ID: {fm['id']} | Name: {fm['name']}")
    else:
        print(f"Failed to get models: {response.text}")
except Exception as e:
    print(f"Error: {e}")
