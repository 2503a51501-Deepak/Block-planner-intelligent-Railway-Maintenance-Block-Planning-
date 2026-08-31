"""
Metrics and Comparison Calculator for RailOpt-AI.
Generates genuine Before (Manual) vs After (AI) analysis and asset availability indices.
"""
from typing import List, Dict, Any
from models.domain import PlanMetrics, ComparisonResult, AssetHealth, MaintenanceTask

def compute_plan_comparison(manual: PlanMetrics, ai: PlanMetrics) -> ComparisonResult:
    blocks_saved = max(0, manual.total_blocks_used - ai.total_blocks_used)
    block_red_pct = round((blocks_saved / max(1, manual.total_blocks_used)) * 100.0, 1)

    hours_saved = max(0.0, round(manual.total_block_hours - ai.total_block_hours, 1))
    hours_red_pct = round((hours_saved / max(1.0, manual.total_block_hours)) * 100.0, 1)

    add_tasks = max(0, ai.scheduled_tasks - manual.scheduled_tasks)

    disruption_diff = manual.train_disruption_score - ai.train_disruption_score
    disruption_red_pct = round((disruption_diff / max(1.0, manual.train_disruption_score)) * 100.0, 1) if disruption_diff > 0 else 0.0

    overdue_diff = manual.overdue_tasks_remaining - ai.overdue_tasks_remaining
    overdue_red_pct = round((overdue_diff / max(1, manual.overdue_tasks_remaining)) * 100.0, 1) if overdue_diff > 0 else 0.0

    avail_gain = round(ai.average_asset_availability - manual.average_asset_availability, 1)

    return ComparisonResult(
        manual_plan=manual,
        ai_plan=ai,
        blocks_saved=blocks_saved,
        block_reduction_pct=block_red_pct,
        hours_saved=hours_saved,
        hours_reduction_pct=hours_red_pct,
        additional_tasks_completed=add_tasks,
        train_disruption_reduction_pct=disruption_red_pct,
        overdue_reduction_pct=overdue_red_pct,
        asset_availability_gain_pct=avail_gain
    )

def compute_asset_health_registry(tasks: List[MaintenanceTask]) -> List[AssetHealth]:
    # Group tasks by asset
    asset_map: Dict[str, Dict[str, Any]] = {}
    for t in tasks:
        if t.asset_id not in asset_map:
            asset_map[t.asset_id] = {
                "asset_id": t.asset_id,
                "asset_name": f"{t.department} - {t.location}",
                "department": t.department,
                "section": t.section,
                "pending": 0,
                "critical": 0,
                "duration_sum": 0.0
            }
        data = asset_map[t.asset_id]
        data["duration_sum"] += t.estimated_duration_hours
        if t.status in ["Pending", "Overdue"]:
            data["pending"] += 1
        if t.severity == "Critical":
            data["critical"] += 1

    registry = []
    for aid, d in asset_map.items():
        # Derive availability percentage from pending maintenance risk
        base_avail = 99.2
        downtime_est = d["duration_sum"] * (1.5 if d["critical"] > 0 else 1.0)
        avail = max(88.0, min(99.8, base_avail - (d["critical"] * 3.5) - (d["pending"] * 0.8)))
        
        condition = "Good" if avail >= 96.0 else ("Moderate" if avail >= 92.0 else "Degraded")
        
        registry.append(AssetHealth(
            asset_id=aid,
            asset_name=d["asset_name"],
            department=d["department"],
            section=d["section"],
            availability_pct=round(avail, 1),
            downtime_hours_month=round(downtime_est, 1),
            pending_tasks_count=d["pending"],
            critical_defects_count=d["critical"],
            condition_index=condition
        ))

    return sorted(registry, key=lambda x: x.availability_pct)
