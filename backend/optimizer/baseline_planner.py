"""
Baseline (Manual / First-Fit) Scheduler for RailOpt-AI.
Simulates conventional uncoordinated scheduling without cross-department grouping.
"""
from typing import List, Dict, Tuple, Any
from models.domain import MaintenanceTask, Train, GoodsForecast, BlockAvailability, RecommendedBlock, PlanMetrics
from optimizer.conflicts import analyze_block_conflicts
import copy

def run_baseline_planning(
    tasks: List[MaintenanceTask],
    blocks: List[BlockAvailability],
    trains: List[Train],
    goods_forecasts: List[GoodsForecast],
    target_date: str = None
) -> Tuple[List[RecommendedBlock], PlanMetrics]:
    # Filter blocks by date if specified
    avail_blocks = [b for b in blocks if (target_date is None or b.date == target_date) and b.status == "Available"]
    # Track available capacity remaining on each block
    block_capacity = {b.block_id: b.maximum_duration for b in avail_blocks}
    
    recommendations: List[RecommendedBlock] = []
    scheduled_task_ids = set()
    total_disruption = 0.0
    total_trains_affected = 0
    
    # Baseline iterates tasks sequentially without multi-department grouping
    for task in tasks:
        if task.status == "Completed":
            continue
        
        # Find first matching block with sufficient duration
        assigned_block = None
        for b in avail_blocks:
            if b.section == task.section:
                if block_capacity[b.block_id] >= task.estimated_duration_hours:
                    assigned_block = b
                    break
        
        if assigned_block:
            # Deduct isolated single-task duration
            block_capacity[assigned_block.block_id] -= task.estimated_duration_hours
            scheduled_task_ids.add(task.task_id)
            
            conflict_info = analyze_block_conflicts(
                assigned_block.section,
                assigned_block.start_time,
                assigned_block.end_time,
                trains,
                goods_forecasts
            )
            total_disruption += conflict_info["train_impact_score"]
            total_trains_affected += conflict_info["affected_trains_count"]

            rec = RecommendedBlock(
                recommendation_id=f"MAN-{len(recommendations)+1:03d}",
                block_id=assigned_block.block_id,
                section=assigned_block.section,
                date=assigned_block.date,
                start_time=assigned_block.start_time,
                end_time=assigned_block.end_time,
                duration_hours=task.estimated_duration_hours,
                tasks=[task],
                task_ids=[task.task_id],
                departments=[task.department],
                priority_level=task.priority_level or "Medium",
                optimization_score=50.0,
                train_impact_score=conflict_info["train_impact_score"],
                affected_trains_count=conflict_info["affected_trains_count"],
                affected_trains=conflict_info["affected_trains"],
                goods_probability=conflict_info["goods_probability"],
                reasons=["Conventional first-fit uncoordinated assignment"],
                score_breakdown={"manual_assignment": 50.0},
                status="Proposed"
            )
            recommendations.append(rec)

    # Compute metrics
    total_eligible = len([t for t in tasks if t.status != "Completed"])
    critical_eligible = len([t for t in tasks if t.severity == "Critical" and t.status != "Completed"])
    critical_scheduled = len([t for t in tasks if t.task_id in scheduled_task_ids and t.severity == "Critical"])
    
    total_hours = sum(r.duration_hours for r in recommendations)
    total_available_hours = sum(b.maximum_duration for b in avail_blocks)
    utilization = (total_hours / total_available_hours * 100.0) if total_available_hours > 0 else 0.0
    
    # Overdue tasks remaining
    overdue_remaining = len([t for t in tasks if t.overdue_days > 0 and t.task_id not in scheduled_task_ids])

    metrics = PlanMetrics(
        total_eligible_tasks=total_eligible,
        scheduled_tasks=len(scheduled_task_ids),
        task_completion_rate=round((len(scheduled_task_ids) / total_eligible * 100.0) if total_eligible > 0 else 0.0, 1),
        total_critical_tasks=critical_eligible,
        critical_tasks_scheduled=critical_scheduled,
        critical_completion_rate=round((critical_scheduled / critical_eligible * 100.0) if critical_eligible > 0 else 0.0, 1),
        total_blocks_used=len(recommendations),
        total_block_hours=round(total_hours, 1),
        available_block_hours=round(total_available_hours, 1),
        block_utilization_rate=round(utilization, 1),
        train_disruption_score=round(total_disruption / max(1, len(recommendations)), 1) if recommendations else 0.0,
        trains_affected_count=total_trains_affected,
        overdue_tasks_remaining=overdue_remaining,
        multi_dept_blocks_count=0,
        average_asset_availability=92.4
    )

    return recommendations, metrics
