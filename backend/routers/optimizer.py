"""
Optimizer Router for Block Planner.
Endpoints for triggering block optimization, retrieving recommendations, accept/modify/reject workflows, and explainability.
"""
from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any
from database.session import get_connection
from models.domain import (
    OptimizationConfig, RecommendedBlock, PlanMetrics,
    MaintenanceTask, Train, GoodsForecast, BlockAvailability
)
from optimizer.block_optimizer import run_ai_block_optimization
from optimizer.baseline_planner import run_baseline_planning
from routers.tasks import row_to_task
import json

router = APIRouter(prefix="/api", tags=["AI Block Optimization"])

CACHE = {
    "last_ai_recommendations": [],
    "last_ai_metrics": None,
    "last_manual_metrics": None,
    "last_config": None
}

def load_environment_data():
    conn = get_connection()
    c = conn.cursor()
    
    c.execute("SELECT * FROM maintenance_tasks")
    tasks = [row_to_task(r) for r in c.fetchall()]
    
    c.execute("SELECT * FROM trains")
    trains = [Train(**dict(r)) for r in c.fetchall()]
    
    c.execute("SELECT * FROM goods_forecasts")
    forecasts = [GoodsForecast(**dict(r)) for r in c.fetchall()]
    
    c.execute("SELECT * FROM block_availability")
    blocks = [BlockAvailability(**dict(r)) for r in c.fetchall()]
    
    conn.close()
    return tasks, trains, forecasts, blocks

@router.post("/optimize")
def optimize_blocks(config: OptimizationConfig):
    tasks, trains, forecasts, blocks = load_environment_data()
    
    # Run AI Optimization
    ai_recs, ai_metrics = run_ai_block_optimization(tasks, blocks, trains, forecasts, config)
    
    # Run Baseline for comparison calculation
    manual_recs, manual_metrics = run_baseline_planning(tasks, blocks, trains, forecasts, target_date=config.target_date)
    
    CACHE["last_ai_recommendations"] = ai_recs
    CACHE["last_ai_metrics"] = ai_metrics
    CACHE["last_manual_metrics"] = manual_metrics
    CACHE["last_config"] = config

    # Persist recommendations to DB
    conn = get_connection()
    c = conn.cursor()
    c.execute("DELETE FROM recommendations")
    c.execute("DELETE FROM recommendation_tasks")
    
    for r in ai_recs:
        c.execute("""
        INSERT INTO recommendations (
            recommendation_id, block_id, section, date, start_time, end_time,
            duration_hours, priority_level, optimization_score, train_impact_score,
            affected_trains_count, affected_trains_json, goods_probability,
            reasons_json, score_breakdown_json, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            r.recommendation_id, r.block_id, r.section, r.date, r.start_time, r.end_time,
            r.duration_hours, r.priority_level, r.optimization_score, r.train_impact_score,
            r.affected_trains_count, json.dumps(r.affected_trains), r.goods_probability,
            json.dumps(r.reasons), json.dumps(r.score_breakdown), r.status
        ))
        for t in r.tasks:
            c.execute("INSERT OR REPLACE INTO recommendation_tasks (recommendation_id, task_id) VALUES (?, ?)", (r.recommendation_id, t.task_id))
            
    conn.commit()
    conn.close()

    return {
        "success": True,
        "recommendations_count": len(ai_recs),
        "recommendations": ai_recs,
        "metrics": ai_metrics,
        "manual_metrics": manual_metrics
    }

@router.get("/recommendations", response_model=List[RecommendedBlock])
def get_recommendations():
    if CACHE["last_ai_recommendations"]:
        return CACHE["last_ai_recommendations"]
    
    default_cfg = OptimizationConfig(horizon="Daily", target_date="2026-08-30")
    res = optimize_blocks(default_cfg)
    return res["recommendations"]

@router.post("/recommendations/{rec_id}/accept")
def accept_recommendation(rec_id: str):
    target_rec = None
    for r in CACHE.get("last_ai_recommendations", []):
        if r.recommendation_id == rec_id:
            r.status = "Accepted"
            target_rec = r
            break

    conn = get_connection()
    c = conn.cursor()
    
    c.execute("UPDATE recommendations SET status = 'Accepted' WHERE recommendation_id = ?", (rec_id,))
    
    # Also find tasks associated with this recommendation
    c.execute("SELECT task_id FROM recommendation_tasks WHERE recommendation_id = ?", (rec_id,))
    task_rows = c.fetchall()
    for row in task_rows:
        c.execute("UPDATE maintenance_tasks SET status = 'In-Progress' WHERE task_id = ?", (row["task_id"],))

    # Persist into recommended_blocks for weekly & monthly roll-up
    if target_rec:
        try:
            tasks_json = json.dumps([t.dict() for t in target_rec.tasks])
            trains_json = json.dumps(target_rec.affected_trains)
            depts_json = json.dumps(target_rec.departments)
            reasons_json = json.dumps(target_rec.reasons)
            c.execute("""
            INSERT OR REPLACE INTO recommended_blocks (
                recommendation_id, section, date, start_time, end_time, duration_hours,
                departments, tasks, affected_trains, train_impact_score, reasons, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                target_rec.recommendation_id, target_rec.section, target_rec.date,
                target_rec.start_time, target_rec.end_time, target_rec.duration_hours,
                depts_json, tasks_json, trains_json, target_rec.train_impact_score,
                reasons_json, "Accepted"
            ))
        except Exception:
            pass

    conn.commit()
    conn.close()
    
    return {"message": f"Recommendation {rec_id} marked as Accepted", "status": "Accepted"}

@router.post("/recommendations/{rec_id}/reject")
def reject_recommendation(rec_id: str):
    for r in CACHE.get("last_ai_recommendations", []):
        if r.recommendation_id == rec_id:
            r.status = "Rejected"
            break
            
    conn = get_connection()
    c = conn.cursor()
    c.execute("UPDATE recommendations SET status = 'Rejected' WHERE recommendation_id = ?", (rec_id,))
    c.execute("UPDATE recommended_blocks SET status = 'Rejected' WHERE recommendation_id = ?", (rec_id,))
    conn.commit()
    conn.close()

    return {"message": f"Recommendation {rec_id} marked as Rejected", "status": "Rejected"}
