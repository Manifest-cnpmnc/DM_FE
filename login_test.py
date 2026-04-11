import urllib.request
import urllib.error
import json

url = 'https://api-ltnc.thaily.id.vn/api/auth/login'
data = json.dumps({'email': 'test@example.com', 'password': 'test1234'}).encode('utf-8')
req = urllib.request.Request(url, data=data, headers={'Content-Type': 'application/json'})
try:
    with urllib.request.urlopen(req, timeout=20) as response:
        print('status', response.status)
        print(response.read().decode('utf-8'))
except urllib.error.HTTPError as e:
    print('status', e.code)
    print(e.read().decode('utf-8'))
except Exception as e:
    print(type(e).__name__, e)
