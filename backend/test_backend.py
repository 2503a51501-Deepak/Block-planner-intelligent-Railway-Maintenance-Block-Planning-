import sys, os
backend_dir = r"C:\Users\LENOVO\.gemini\antigravity\scratch\railopt-ai\backend"
sys.path.insert(0, backend_dir)

from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

# 1. Health / Root
res = client.get("/api/health")
assert res.status_code == 200
print("Health API OK:", res.json()["project"])

# 2. Get Tasks
res = client.get("/api/tasks")
assert res.status_code == 200
tasks = res.json()
assert len(tasks) >= 25
print(f"Tasks Endpoint OK: {len(tasks)} tasks loaded. Top task: {tasks[0]['task_id']} with priority {tasks[0]['priority_score']}")

# 3. Optimize (Daily Horizon)
res = client.post("/api/optimize", json={"horizon": "Daily", "target_date": "2026-08-30"})
assert res.status_code == 200
data = res.json()
recs = data["recommendations"]
print(f"Optimization OK: Generated {len(recs)} recommended blocks.")

# Check for multi-department grouping in recommendations
grouped_recs = [r for r in recs if len(r["departments"]) > 1]
print(f"Multi-department blocks count: {len(grouped_recs)}")
assert len(grouped_recs) >= 1
top_group = grouped_recs[0]
print(f"Grouped block {top_group['recommendation_id']} in {top_group['section']} combines departments: {top_group['departments']} (Tasks: {top_group['task_ids']})")

# 4. Analytics & Comparison
res = client.get("/api/analytics/dashboard")
assert res.status_code == 200
analytics = res.json()
print("Analytics Dashboard OK! KPIs:", analytics["kpis"])

res = client.get("/api/analytics/comparison")
assert res.status_code == 200
comp = res.json()
print(f"Comparison OK! Blocks saved: {comp['blocks_saved']}, Disruption reduction: {comp['train_disruption_reduction_pct']}%, Asset availability gain: {comp['asset_availability_gain_pct']}%")

# 5. Simulation
res = client.post("/api/simulate", json={"train_traffic_density": "High", "goods_traffic_multiplier": 1.5, "criticality_threshold": 50, "available_block_hours_factor": 1.0, "emergency_tasks": []})
assert res.status_code == 200
sim_data = res.json()
print("Simulation OK! Scenario B diff:", sim_data["diff_summary"])

print("ALL BACKEND VERIFICATION TESTS PASSED SUCCESSFULLY!")
