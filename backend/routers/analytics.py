from optimizer.block_optimizer import run_ai_block_optimization
"""
Analytics and Planning Router for RailOpt-AI.
Provides dashboard metrics, KPI aggregations, weekly/monthly plans, and asset availability analytics.
"""
from fastapi import APIRouter
from typing import List, Dict, Any
from database.session import get_connection
from models.domain import OptimizationConfig, PlanMetrics, ComparisonResult, AssetHealth
from routers.optimizer import load_environment_data, CACHE, optimize_blocks
from optimizer.metrics import compute_plan_comparison, compute_asset_health_registry
from scoring.priority_engine import score_all_tasks

router = APIRouter(prefix="/api", tags=["Analytics & Reporting"])

@router.get("/analytics/dashboard")
def get_dashboard_analytics():
    tasks, trains, forecasts, blocks = load_environment_data()
    scored_tasks = score_all_tasks(tasks)

    # Ensure optimization has been run at least once
    if not CACHE["last_ai_metrics"]:
        default_cfg = OptimizationConfig(horizon="Daily", target_date="2026-08-30")
        optimize_blocks(default_cfg)

    ai_metrics: PlanMetrics = CACHE["last_ai_metrics"]
    manual_metrics: PlanMetrics = CACHE["last_manual_metrics"]
    comparison = compute_plan_comparison(manual_metrics, ai_metrics)

    # 1. Tasks by Department
    dept_counts = {"Engineering": 0, "Traction": 0, "Signal & Telecom": 0}
    for t in scored_tasks:
        dept_counts[t.department] = dept_counts.get(t.department, 0) + 1
    tasks_by_dept = [{"department": k, "count": v} for k, v in dept_counts.items()]

    # 2. Tasks by Priority
    prio_counts = {"Critical": 0, "High": 0, "Medium": 0, "Low": 0}
    for t in scored_tasks:
        lvl = t.priority_level or "Medium"
        prio_counts[lvl] = prio_counts.get(lvl, 0) + 1
    tasks_by_priority = [{"priority": k, "count": v} for k, v in prio_counts.items()]

    # 3. Train Traffic by Hour (24h distribution)
    hourly_traffic = [{"hour": f"{h:02d}:00", "trains": 0, "goods": 0} for h in range(24)]
    for tr in trains:
        try:
            h = int(tr.arrival_time.split(":")[0])
            if 0 <= h < 24:
                if tr.train_type == "Goods":
                    hourly_traffic[h]["goods"] += 1
                else:
                    hourly_traffic[h]["trains"] += 1
        except Exception:
            pass

    # 4. Section Health & Downtime
    asset_registry = compute_asset_health_registry(scored_tasks)

    # 5. Asset Availability Trend (Simulated Historical 6-month & projected)
    availability_trend = [
        {"month": "Apr 2026", "manual_baseline": 91.2, "ai_optimized": 94.5},
        {"month": "May 2026", "manual_baseline": 91.8, "ai_optimized": 95.2},
        {"month": "Jun 2026", "manual_baseline": 90.5, "ai_optimized": 96.0},
        {"month": "Jul 2026", "manual_baseline": 92.0, "ai_optimized": 96.8},
        {"month": "Aug 2026", "manual_baseline": 92.4, "ai_optimized": ai_metrics.average_asset_availability},
        {"month": "Sep (Proj)", "manual_baseline": 92.6, "ai_optimized": 98.4}
    ]

    return {
        "kpis": {
            "total_tasks": len(scored_tasks),
            "critical_tasks": prio_counts["Critical"],
            "overdue_tasks": len([t for t in scored_tasks if t.overdue_days > 0]),
            "available_blocks": len(blocks),
            "recommended_blocks": ai_metrics.total_blocks_used,
            "tasks_scheduled": ai_metrics.scheduled_tasks,
            "task_completion_rate": ai_metrics.task_completion_rate,
            "estimated_block_reduction": f"{comparison.block_reduction_pct}%",
            "estimated_train_disruption_reduction": f"{comparison.train_disruption_reduction_pct}%",
            "hours_saved": comparison.hours_saved,
            "current_asset_availability": f"{ai_metrics.average_asset_availability}%"
        },
        "charts": {
            "tasks_by_department": tasks_by_dept,
            "tasks_by_priority": tasks_by_priority,
            "train_traffic_by_hour": hourly_traffic,
            "availability_trend": availability_trend,
            "manual_vs_ai_radar": [
                {"metric": "Block Efficiency", "Manual": 45, "AI": 88},
                {"metric": "Train Non-Disruption", "Manual": 52, "AI": 85},
                {"metric": "Multi-Dept Coordination", "Manual": 10, "AI": 92},
                {"metric": "Critical Defect Clearance", "Manual": 60, "AI": 95},
                {"metric": "Asset Availability", "Manual": 70, "AI": 94}
            ]
        },
        "comparison": comparison
    }

@router.get("/analytics/comparison", response_model=ComparisonResult)
def get_comparison():
    if not CACHE["last_ai_metrics"]:
        default_cfg = OptimizationConfig(horizon="Daily", target_date="2026-08-30")
        optimize_blocks(default_cfg)
    return compute_plan_comparison(CACHE["last_manual_metrics"], CACHE["last_ai_metrics"])

@router.get("/analytics/asset-health", response_model=List[AssetHealth])
def get_asset_health():
    tasks, _, _, _ = load_environment_data()
    return compute_asset_health_registry(tasks)

@router.get("/weekly-plan")
@router.get("/analytics/weekly-plan")
def get_weekly_plan():
    tasks, trains, forecasts, blocks = load_environment_data()
    # Optimize over weekly window
    cfg = OptimizationConfig(horizon="Weekly", target_date=None)
    recs, metrics = run_ai_block_optimization(tasks, blocks, trains, forecasts, cfg)
    
    # Group by date
    days_map = {}
    day_names = ["MON (31 Aug)", "TUE (01 Sep)", "WED (02 Sep)", "THU (03 Sep)", "FRI (04 Sep)", "SAT (05 Sep)"]
    dates = ["2026-08-31", "2026-09-01", "2026-09-02", "2026-09-03", "2026-09-04", "2026-09-05"]
    
    for idx, d in enumerate(dates):
        d_recs = [r for r in recs if r.date == d]
        total_t = sum(len(r.tasks) for r in d_recs)
        days_map[d] = {
            "date": d,
            "day_label": day_names[idx],
            "blocks_count": len(d_recs),
            "tasks_count": total_t,
            "blocks": d_recs
        }

    return {
        "weekly_schedule": list(days_map.values()),
        "total_blocks": len(recs),
        "total_tasks_scheduled": sum(len(r.tasks) for r in recs),
        "metrics": metrics
    }

@router.get("/monthly-plan")
@router.get("/analytics/monthly-plan")
def get_monthly_plan():
    tasks, _, _, blocks = load_environment_data()
    
    dept_workload = [
        {"department": "Engineering", "planned_hours": 42.5, "completed_hours": 36.0, "target_hours": 48.0},
        {"department": "Traction", "planned_hours": 28.0, "completed_hours": 24.5, "target_hours": 30.0},
        {"department": "Signal & Telecom", "planned_hours": 22.0, "completed_hours": 20.0, "target_hours": 25.0}
    ]

    return {
        "month": "September 2026",
        "total_planned_blocks": 38,
        "total_maintenance_tasks": 65,
        "critical_tasks_target": 18,
        "projected_overdue_cleared_pct": 94.2,
        "department_workload": dept_workload,
        "asset_availability_target": 98.5
    }
