
import requests
import json
import uuid

url = 'http://localhost:5000/api/gifts'
# Small red dot base64
img_data = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAHElEQVQI12P4//8/w38GIAXDIBKE0DHxgljNBAAO9TXL0Y4OHwAAAABJRU5ErkJggg=="

payload = {
    "userId": "675bcd6661df6e1f0624c478", # Use a valid ID from DB if possible, or create new. 
    # Wait, I need a valid userId. Let's fetch users first.
    "title": "Curl Test Gift",
    "description": "Testing upload from script",
    "imageData": img_data
}

# Fetch users to get an ID
try:
    users_res = requests.get('http://localhost:5000/api/users')
    users = users_res.json()
    if users:
        payload['userId'] = users[0]['id']
    else:
        # Create a user first
        u_res = requests.post('http://localhost:5000/api/users', json={"name": "TestUser", "avatar": "🤖"})
        payload['userId'] = u_res.json()['id']
except Exception as e:
    print(f"Error getting user: {e}")
    # Fallback ID (might fail if foreign key enforced app-side, but schema doesn't strictly enforce ref)
    payload['userId'] = "test-user-id"

print(f"Posting gift for user {payload['userId']}...")
try:
    res = requests.post(url, json=payload)
    print(f"Status: {res.status_code}")
    print(f"Response: {res.text}")
except Exception as e:
    print(f"Error posting: {e}")
