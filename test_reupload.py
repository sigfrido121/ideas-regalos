
import urllib.request
import json
import random
import sys

# GET
print("Fetching gifts...")
try:
    with urllib.request.urlopen('http://localhost:5000/api/gifts') as response:
        data = response.read()
        gifts = json.loads(data)
except Exception as e:
    print(f"Error fetching: {e}")
    sys.exit(1)

if not gifts:
    print("No gifts.")
    sys.exit(0)

target = next((g for g in gifts if g.get('imageData')), None)
if not target:
    print("No image data found.")
    sys.exit(0)

print(f"Original starts with: {target['imageData'][:50]}")

# POST
new_payload = {
    "title": f"Reupload Test {random.randint(1000,9999)}",
    "description": "Test re-upload",
    "imageData": target['imageData'],
    "userId": target.get('userId', 'testuser'),
    "permits": "testpermit"
}

print("Posting new gift...")
req = urllib.request.Request('http://localhost:5000/api/gifts')
req.add_header('Content-Type', 'application/json')
try:
    jsondata = json.dumps(new_payload).encode('utf-8')
    with urllib.request.urlopen(req, jsondata) as f:
        print(f"Status: {f.getcode()}")
        print(f"Response: {f.read().decode('utf-8')}")
except Exception as e:
    print(f"Post Error: {e}")
    if hasattr(e, 'read'):
        print(e.read().decode('utf-8'))
