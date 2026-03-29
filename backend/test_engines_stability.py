import os
import requests
from dotenv import load_dotenv
load_dotenv()
API_KEY = os.getenv("STABILITY_API_KEY")
url = "https://api.stability.ai/v1/engines/list"
response = requests.get(url, headers={"Authorization": f"Bearer {API_KEY}"})
if response.status_code == 200:
    for e in response.json():
        if e['type'] == 'PICTURE':
            print("Engine ID:", e['id'])
else:
    print(response.text)
