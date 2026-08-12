import os
import requests
from dotenv import load_dotenv

load_dotenv()

api_key = os.getenv("AZURE_OPENAI_API_KEY")
deployment = os.getenv("AZURE_OPENAI_DEPLOYMENT")

url = os.getenv("AZURE_OPENAI_ENDPOINT", "https://the-black-box-uae-resource.services.ai.azure.com/openai/v1/responses")

print("URL:", url)
print("DEPLOYMENT:", deployment)

headers = {
    "Content-Type": "application/json",
    "api-key": api_key
}

data = {
    "model": deployment,
    "input": "Reply with exactly: AZURE AI CONNECTED"
}

response = requests.post(
    url,
    headers=headers,
    json=data,
    timeout=30
)

print("\nSTATUS:", response.status_code)
print("RESPONSE:")

try:
    print(response.json())
except:
    print(response.text)