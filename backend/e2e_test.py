from dotenv import load_dotenv; load_dotenv()
import requests, json

BASE = "http://127.0.0.1:8000/api"

# 1. Create customer
r = requests.post(f"{BASE}/customers", json={
    "fantasy_name": "TestHero",
    "age_group": "18-24",
    "adventure_style": "Action",
    "self_description": "Curious"
})
print(f"[1] POST /customers -> {r.status_code}")
customer_id = r.json()["customer_id"]

# 2. Create session
r = requests.post(f"{BASE}/sessions", json={"customer_id": customer_id})
print(f"[2] POST /sessions -> {r.status_code}")
session_id = r.json()["session_id"]
print(f"    session_id={session_id}")

# 3. Answer all 10 questions
for q in range(1, 11):
    r = requests.get(f"{BASE}/scenarios/next?session_id={session_id}")
    print(f"[3.{q}] GET /scenarios/next -> {r.status_code}")
    if r.status_code != 200:
        print(f"    ERROR: {r.text}")
        break
    scenario = r.json()
    option_id = scenario["options"][0]["option_id"]  # always pick first option

    r2 = requests.post(f"{BASE}/responses", json={
        "session_id": session_id,
        "customer_id": customer_id,
        "scenario_id": scenario["scenario_id"],
        "option_id": option_id,
        "question_number": q,
        "time_taken_ms": 1500
    })
    print(f"     POST /responses -> {r2.status_code} | {r2.text}")
    if r2.status_code != 201:
        break

# 4. Get result
r = requests.get(f"{BASE}/sessions/{session_id}/result")
print(f"\n[4] GET /sessions/result -> {r.status_code}")
print(json.dumps(r.json(), indent=2))
