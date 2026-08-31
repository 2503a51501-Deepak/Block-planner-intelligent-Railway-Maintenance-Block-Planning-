"""
Priority Engine for RailOpt-AI
Calculates explainable multi-factor maintenance priority scores.
"""
from typing import Dict, List, Tuple
from models.domain import MaintenanceTask
from config import PriorityWeights, settings

SEVERITY_SCORES = {
    "Critical": 100.0,
    "High": 75.0,
    "Medium": 45.0,
    "Low": 20.0
}

CRITICALITY_SCORES = {
    "Critical": 100.0,
    "High": 75.0,
    "Medium": 50.0,
    "Low": 25.0
}

SECTION_IMPACT_SCORES = {
    "KZJ-WL": 95.0,     # Heavy corridor junction
    "SEC-KZJ": 90.0,    # High density trunk line
    "WL-BZA": 88.0,     # Grand Trunk high speed route
    "BZA-GNT": 60.0     # Feeder / branch route
}

def calculate_overdue_score(overdue_days: int) -> float:
    if overdue_days >= 5:
        return 100.0
    elif overdue_days == 4:
        return 85.0
    elif overdue_days == 3:
        return 70.0
    elif overdue_days == 2:
        return 55.0
    elif overdue_days == 1:
        return 40.0
    return 15.0

def calculate_priority(
    task: MaintenanceTask,
    weights: PriorityWeights = settings.DEFAULT_PRIORITY_WEIGHTS
) -> Tuple[float, str, List[str], Dict[str, float]]:
    sev_raw = SEVERITY_SCORES.get(task.severity, 40.0)
    crit_raw = CRITICALITY_SCORES.get(task.asset_criticality, 40.0)
    overdue_raw = calculate_overdue_score(task.overdue_days)
    
    # Train / Operational Impact
    base_sec_impact = SECTION_IMPACT_SCORES.get(task.section, 70.0)
    if task.requires_power_block and task.requires_traffic_block:
        impact_raw = min(100.0, base_sec_impact + 10.0)
    elif task.requires_traffic_block:
        impact_raw = base_sec_impact
    else:
        impact_raw = max(30.0, base_sec_impact - 25.0)

    # Normalize weights
    total_w = weights.severity + weights.asset_criticality + weights.overdue_factor + weights.train_impact
    if total_w <= 0:
        total_w = 1.0
    w_s = weights.severity / total_w
    w_c = weights.asset_criticality / total_w
    w_o = weights.overdue_factor / total_w
    w_i = weights.train_impact / total_w

    sev_contrib = round(w_s * sev_raw, 1)
    crit_contrib = round(w_c * crit_raw, 1)
    overdue_contrib = round(w_o * overdue_raw, 1)
    impact_contrib = round(w_i * impact_raw, 1)

    total_score = round(sev_contrib + crit_contrib + overdue_contrib + impact_contrib, 1)
    total_score = min(100.0, max(0.0, total_score))

    # Priority Level
    if total_score >= 80.0:
        level = "Critical"
    elif total_score >= 60.0:
        level = "High"
    elif total_score >= 40.0:
        level = "Medium"
    else:
        level = "Low"

    # Human-readable reasons
    reasons = []
    if task.severity == "Critical":
        reasons.append(f"Critical defect severity requiring urgent track/OHE safety clearance (+{sev_contrib})")
    elif task.severity == "High":
        reasons.append(f"High severity maintenance defect (+{sev_contrib})")

    if task.asset_criticality in ["Critical", "High"]:
        reasons.append(f"Asset located on high-criticality trunk route asset (+{crit_contrib})")

    if task.overdue_days > 0:
        reasons.append(f"Maintenance task is overdue by {task.overdue_days} day(s) (+{overdue_contrib})")
    else:
        reasons.append(f"Preventive maintenance scheduled within standard interval (+{overdue_contrib})")

    if impact_raw >= 80.0:
        reasons.append(f"Section {task.section} operates near capacity; block planning essential (+{impact_contrib})")

    breakdown = {
        "severity_contribution": sev_contrib,
        "criticality_contribution": crit_contrib,
        "overdue_contribution": overdue_contrib,
        "impact_contribution": impact_contrib,
        "raw_severity": sev_raw,
        "raw_criticality": crit_raw,
        "raw_overdue": overdue_raw,
        "raw_impact": impact_raw
    }

    return total_score, level, reasons, breakdown

def score_all_tasks(tasks: List[MaintenanceTask], weights: PriorityWeights = settings.DEFAULT_PRIORITY_WEIGHTS) -> List[MaintenanceTask]:
    for t in tasks:
        score, level, reasons, breakdown = calculate_priority(t, weights)
        t.priority_score = score
        t.priority_level = level
        t.score_reasons = reasons
        t.score_breakdown = breakdown
    return sorted(tasks, key=lambda x: x.priority_score or 0.0, reverse=True)
