"""
AI Constraint-Based Multi-Department Block Optimizer for RailOpt-AI.
Optimizes maintenance allocation, bundles multi-department tasks, and minimizes train disruption.
"""
from typing import List, Dict, Tuple, Any, Optional
from models.domain import (
    MaintenanceTask, Train, GoodsForecast, BlockAvailability,
    RecommendedBlock, OptimizationConfig, PlanMetrics
)
from scoring.priority_engine import calculate_priority, score_all_tasks
from optimizer.conflicts import analyze_block_conflicts
from config import PriorityWeights, settings
import math

def run_ai_block_optimization(
    tasks: List[MaintenanceTask],
    blocks: List[BlockAvailability],
    trains: List[Train],
    goods_forecasts: List[GoodsForecast],
    config: OptimizationConfig
) -> Tuple[List[RecommendedBlock], PlanMetrics]:
    # 1. Custom priority weights if configured
    p_weights = PriorityWeights(
        severity=config.custom_severity_weight if config.custom_severity_weight is not None else settings.DEFAULT_PRIORITY_WEIGHTS.severity,
        asset_criticality=config.custom_criticality_weight if config.custom_criticality_weight is not None else settings.DEFAULT_PRIORITY_WEIGHTS.asset_criticality,
        overdue_factor=config.custom_overdue_weight if config.custom_overdue_weight is not None else settings.DEFAULT_PRIORITY_WEIGHTS.overdue_factor,
        train_impact=config.custom_train_impact_weight if config.custom_train_impact_weight is not None else settings.DEFAULT_PRIORITY_WEIGHTS.train_impact
    )
    
    # 2. Score and sort tasks
    scored_tasks = score_all_tasks(tasks, p_weights)

    # 3. Filter tasks based on config
    filtered_tasks = []
    for t in scored_tasks:
        if t.status == "Completed":
            continue
        if config.section_filter and config.section_filter != "All" and t.section != config.section_filter:
            continue
        if config.min_priority and config.min_priority != "All":
            if config.min_priority == "Critical" and t.priority_level != "Critical":
                continue
            elif config.min_priority == "High" and t.priority_level not in ["Critical", "High"]:
                continue
            elif config.min_priority == "Medium" and t.priority_level not in ["Critical", "High", "Medium"]:
                continue
        filtered_tasks.append(t)

    # 4. Filter candidate blocks
    avail_blocks = []
    for b in blocks:
        if b.status != "Available":
            continue
        if config.section_filter and config.section_filter != "All" and b.section != config.section_filter:
            continue
        if config.target_date and config.horizon == "Daily" and b.date != config.target_date:
            continue
        avail_blocks.append(b)

    # If no pre-seeded slots exist for this section, dynamically derive candidate windows
    if not avail_blocks and config.section_filter and config.section_filter != "All":
        target_d = config.target_date or "2026-08-30"
        avail_blocks.append(BlockAvailability(
            block_id=f"DYN-{config.section_filter}-AFT",
            section=config.section_filter,
            date=target_d,
            start_time="13:00",
            end_time="15:00",
            maximum_duration=2.0,
            status="Available"
        ))
        avail_blocks.append(BlockAvailability(
            block_id=f"DYN-{config.section_filter}-NGT",
            section=config.section_filter,
            date=target_d,
            start_time="01:30",
            end_time="04:30",
            maximum_duration=3.0,
            status="Available"
        ))

    # Group candidate tasks by section
    tasks_by_section: Dict[str, List[MaintenanceTask]] = {}
    for t in filtered_tasks:
        tasks_by_section.setdefault(t.section, []).append(t)

    recommendations: List[RecommendedBlock] = []
    scheduled_task_ids = set()
    used_teams: Dict[str, str] = {} # team -> block_id to prevent simultaneous gang overlap

    # 5. Optimization Loop: Match candidate blocks with optimal task bundles
    rec_counter = 1
    for block in avail_blocks:
        sec_tasks = tasks_by_section.get(block.section, [])
        eligible_for_block = [t for t in sec_tasks if t.task_id not in scheduled_task_ids]
        if not eligible_for_block:
            continue

        # Check train conflicts & hard safety rules
        conflict_info = analyze_block_conflicts(
            block.section,
            block.start_time,
            block.end_time,
            trains,
            goods_forecasts,
            tolerance=config.train_disruption_tolerance
        )

        # Hard safety constraint: Do not schedule block if Priority 1 high-speed passenger train passes through
        if conflict_info["has_hard_safety_conflict"]:
            continue

        # Bundle tasks for this block (Multi-Department Grouping)
        selected_tasks_for_block: List[MaintenanceTask] = []
        max_duration_needed = 0.0
        departments_in_bundle = set()

        # Try to select the highest priority tasks, preferring cross-department combination
        if config.enable_multi_dept_grouping:
            # Group eligible by department
            dept_buckets: Dict[str, List[MaintenanceTask]] = {}
            for t in eligible_for_block:
                dept_buckets.setdefault(t.department, []).append(t)

            # Pick highest priority task from each available department that fits in duration
            for dept, d_tasks in dept_buckets.items():
                for candidate in d_tasks:
                    if candidate.task_id in scheduled_task_ids:
                        continue
                    if candidate.required_team in used_teams and used_teams[candidate.required_team] == block.block_id:
                        continue # Same team cannot do two things simultaneously

                    new_max_dur = max(max_duration_needed, candidate.estimated_duration_hours)
                    if new_max_dur <= block.maximum_duration:
                        selected_tasks_for_block.append(candidate)
                        max_duration_needed = new_max_dur
                        departments_in_bundle.add(dept)
                        used_teams[candidate.required_team] = block.block_id
                        break # One primary task per department per bundle for maximum parallel harmony
        else:
            # Single task assignment mode
            for candidate in eligible_for_block:
                if candidate.estimated_duration_hours <= block.maximum_duration:
                    selected_tasks_for_block.append(candidate)
                    max_duration_needed = candidate.estimated_duration_hours
                    departments_in_bundle.add(candidate.department)
                    break

        if not selected_tasks_for_block:
            continue

        # Mark tasks scheduled
        for st in selected_tasks_for_block:
            scheduled_task_ids.add(st.task_id)

        # Calculate explainable optimization score
        avg_priority = sum(t.priority_score or 50.0 for t in selected_tasks_for_block) / len(selected_tasks_for_block)
        crit_count = sum(1 for t in selected_tasks_for_block if t.severity == "Critical")
        overdue_count = sum(1 for t in selected_tasks_for_block if t.overdue_days > 0)
        
        # Multi-department bonus
        multi_dept_bonus = 0.0
        if len(departments_in_bundle) >= 3:
            multi_dept_bonus = 25.0
        elif len(departments_in_bundle) == 2:
            multi_dept_bonus = 15.0

        # Efficiency bonus: duration utilization
        dur_efficiency = min(15.0, (max_duration_needed / block.maximum_duration) * 15.0)
        
        # Train disruption penalty
        train_penalty = min(30.0, conflict_info["train_impact_score"] * 0.3)
        goods_penalty = min(15.0, conflict_info["goods_probability"] * 15.0)

        raw_opt_score = (
            (avg_priority * 0.45)
            + (crit_count * 10.0)
            + (overdue_count * 5.0)
            + multi_dept_bonus
            + dur_efficiency
            - train_penalty
            - goods_penalty
        )
        final_opt_score = round(min(98.0, max(40.0, raw_opt_score)), 1)

        # Build Explainability Reasons
        reasons = []
        if crit_count > 0:
            reasons.append(f"Resolves {crit_count} critical track/OHE safety defect(s)")
        if len(departments_in_bundle) > 1:
            reasons.append(f"Simultaneously coordinates maintenance across {len(departments_in_bundle)} departments ({', '.join(departments_in_bundle)})")
            reasons.append(f"Eliminates {len(departments_in_bundle)-1} separate corridor block closures into a single 1-shot window")
        if conflict_info["train_impact_score"] < 25.0:
            reasons.append(f"Low train disruption score ({conflict_info['train_impact_score']}/100); no high-priority express delays")
        if conflict_info["goods_probability"] <= 0.35:
            reasons.append(f"Scheduled during low freight forecast probability ({int(conflict_info['goods_probability']*100)}%)")
        if dur_efficiency >= 10.0:
            reasons.append(f"Optimally utilizes available block window ({max_duration_needed}h used of {block.maximum_duration}h)")

        score_breakdown = {
            "priority_factor": round(avg_priority * 0.45, 1),
            "critical_bonus": round(crit_count * 10.0, 1),
            "multi_department_bonus": round(multi_dept_bonus, 1),
            "block_efficiency": round(dur_efficiency, 1),
            "train_disruption_penalty": -round(train_penalty, 1),
            "goods_freight_penalty": -round(goods_penalty, 1),
            "final_score": final_opt_score
        }

        # Overall priority tag
        overall_priority = "Critical" if (crit_count > 0 or avg_priority >= 75) else ("High" if avg_priority >= 55 else "Medium")

        rec = RecommendedBlock(
            recommendation_id=f"AI-REC-{rec_counter:03d}",
            block_id=block.block_id,
            section=block.section,
            date=block.date,
            start_time=block.start_time,
            end_time=block.end_time,
            duration_hours=max_duration_needed,
            tasks=selected_tasks_for_block,
            task_ids=[t.task_id for t in selected_tasks_for_block],
            departments=list(departments_in_bundle),
            priority_level=overall_priority,
            optimization_score=final_opt_score,
            train_impact_score=conflict_info["train_impact_score"],
            affected_trains_count=conflict_info["affected_trains_count"],
            affected_trains=conflict_info["affected_trains"],
            goods_probability=conflict_info["goods_probability"],
            reasons=reasons,
            score_breakdown=score_breakdown,
            status="Proposed"
        )
        recommendations.append(rec)
        rec_counter += 1

    # 6. Calculate Plan Metrics
    total_eligible = len(filtered_tasks)
    critical_eligible = len([t for t in filtered_tasks if t.severity == "Critical"])
    critical_scheduled = len([t for t in filtered_tasks if t.task_id in scheduled_task_ids and t.severity == "Critical"])
    
    total_hours = sum(r.duration_hours for r in recommendations)
    total_available_hours = sum(b.maximum_duration for b in avail_blocks)
    utilization = (total_hours / total_available_hours * 100.0) if total_available_hours > 0 else 0.0
    
    multi_dept_count = sum(1 for r in recommendations if len(r.departments) > 1)
    total_disruption = sum(r.train_impact_score for r in recommendations)
    total_trains_affected = sum(r.affected_trains_count for r in recommendations)
    overdue_remaining = len([t for t in filtered_tasks if t.overdue_days > 0 and t.task_id not in scheduled_task_ids])

    # Dynamic asset availability derived from cleared downtime risk
    base_availability = 94.0
    availability_gain = (len(scheduled_task_ids) / max(1, total_eligible)) * 4.8
    availability_score = round(min(99.4, base_availability + availability_gain), 1)

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
        multi_dept_blocks_count=multi_dept_count,
        average_asset_availability=availability_score
    )

    return recommendations, metrics
