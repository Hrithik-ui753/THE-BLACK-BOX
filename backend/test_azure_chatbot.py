import os
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

TEST_BATTERY_ID = "164de9f0-62ee-411a-b8b9-a73eb2406f97"

questions = [
    "What is the current battery status?",
    "Why is Cell 2 voltage lower?",
    "Is the battery safe?",
    "What is the current SOH?",
    "What does this temperature mean?",
    "Explain the battery condition in simple words.",
    "What should I do if the battery temperature increases?",
    "Summarize the battery health."
]

def run_tests():
    print("==================================================")
    print("TESTING THE BLACK BOX AZURE GPT-4.1-MINI CHATBOT")
    print("==================================================")

    for i, q in enumerate(questions, 1):
        print(f"\n--- Question {i}: {q} ---")
        payload = {
            "message": q,
            "battery_id": TEST_BATTERY_ID
        }
        response = client.post("/api/chat", json=payload)
        print(f"HTTP Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"Chatbot Reply Status: {data.get('status')}")
            print(f"Reply:\n{data.get('reply')}\n")
        else:
            print(f"Error: {response.text}")

if __name__ == "__main__":
    run_tests()
