import urllib.request
import json

print("1. Testing GET /api/ml/health...")
with urllib.request.urlopen("http://127.0.0.1:8000/api/ml/health") as res:
    print(res.read().decode())

print("\n2. Testing POST /api/ml/predict (Schizophrenia 8 items endorsed)...")
req_data = json.dumps({
    "assessment_type": "schizophrenia",
    "age_group": "19-25",
    "answers": [{"id": i, "answer": "True" if i <= 8 else "False"} for i in range(1, 17)]
}).encode('utf-8')

req = urllib.request.Request(
    "http://127.0.0.1:8000/api/ml/predict",
    data=req_data,
    headers={"Content-Type": "application/json"}
)

with urllib.request.urlopen(req) as res:
    print(res.read().decode())

print("\n3. Testing POST /api/ml/predict (Bipolar 9 items endorsed)...")
bipolar_data = json.dumps({
    "assessment_type": "bipolar",
    "age_group": "19-25",
    "answers": [{"id": i, "answer": "True" if i <= 9 or i in [14, 15] else "False"} for i in range(1, 16)]
}).encode('utf-8')

req2 = urllib.request.Request(
    "http://127.0.0.1:8000/api/ml/predict",
    data=bipolar_data,
    headers={"Content-Type": "application/json"}
)

with urllib.request.urlopen(req2) as res:
    print(res.read().decode())

print("\n4. Testing POST /api/ml/predict with child age group '6-12'...")
child_data = json.dumps({
    "assessment_type": "schizophrenia",
    "age_group": "6-12",
    "answers": [{"id": 1, "answer": "True"}]
}).encode('utf-8')

req3 = urllib.request.Request(
    "http://127.0.0.1:8000/api/ml/predict",
    data=child_data,
    headers={"Content-Type": "application/json"}
)

with urllib.request.urlopen(req3) as res:
    print(res.read().decode())
