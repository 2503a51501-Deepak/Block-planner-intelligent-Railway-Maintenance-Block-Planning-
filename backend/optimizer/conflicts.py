"""
Train & Goods Forecast Conflict Analyzer for RailOpt-AI.
Detects schedule overlap, calculates disruption scores, and enforces hard safety rules.
"""
from typing import List, Dict, Tuple, Any
from models.domain import Train, GoodsForecast, BlockAvailability

def time_to_minutes(t_str: str) -> int:
    try:
        parts = t_str.strip().split(":")
        return int(parts[0]) * 60 + int(parts[1])
    except Exception:
        return 0

def minutes_to_time(mins: int) -> str:
    h = (mins // 60) % 24
    m = mins % 60
    return f"{h:02d}:{m:02d}"

def calculate_overlap_minutes(start1: int, end1: int, start2: int, end2: int) -> int:
    overlap_start = max(start1, start2)
    overlap_end = min(end1, end2)
    return max(0, overlap_end - overlap_start)

def analyze_block_conflicts(
    section: str,
    start_time: str,
    end_time: str,
    trains: List[Train],
    goods_forecasts: List[GoodsForecast],
    tolerance: str = "Medium" # Low, Medium, High
) -> Dict[str, Any]:
    b_start = time_to_minutes(start_time)
    b_end = time_to_minutes(end_time)
    
    affected_trains = []
    total_penalty = 0.0
    has_hard_safety_conflict = False

    # Tolerance weights
    tol_mult = 1.0
    if tolerance == "Low":
        tol_mult = 1.5
    elif tolerance == "High":
        tol_mult = 0.65

    for train in trains:
        if train.section != section:
            continue
        
        t_arr = time_to_minutes(train.arrival_time)
        t_dep = time_to_minutes(train.departure_time)
        
        overlap = calculate_overlap_minutes(b_start, b_end, t_arr, t_dep)
        if overlap > 0:
            # Priority weights
            if train.priority == 1:
                weight = 50.0
                # Safety constraint: Vande Bharat / Rajdhani cannot be obstructed without detour
                has_hard_safety_conflict = True
            elif train.priority == 2:
                weight = 25.0
            elif train.priority == 3:
                weight = 12.0
            else:
                weight = 6.0
            
            penalty = weight * (overlap / 60.0) * tol_mult
            total_penalty += penalty
            
            affected_trains.append({
                "train_id": train.train_id,
                "train_number": train.train_number,
                "train_name": train.train_name,
                "train_type": train.train_type,
                "priority": train.priority,
                "overlap_minutes": overlap,
                "impact_penalty": round(penalty, 1)
            })

    # Goods Forecast Overlap
    goods_prob_max = 0.0
    goods_penalty = 0.0
    for gf in goods_forecasts:
        if gf.section != section:
            continue
        gf_start = time_to_minutes(gf.expected_start_time)
        gf_end = time_to_minutes(gf.expected_end_time)
        
        gf_overlap = calculate_overlap_minutes(b_start, b_end, gf_start, gf_end)
        if gf_overlap > 0:
            goods_prob_max = max(goods_prob_max, gf.probability)
            level_factor = 20.0 if gf.traffic_level == "High" else (10.0 if gf.traffic_level == "Medium" else 5.0)
            goods_penalty += (gf.probability * level_factor * (gf_overlap / 60.0))

    total_penalty += goods_penalty

    # Normalize impact score 0 - 100
    impact_score = min(100.0, round(total_penalty, 1))

    return {
        "affected_trains": affected_trains,
        "affected_trains_count": len(affected_trains),
        "train_impact_score": impact_score,
        "goods_probability": round(goods_prob_max, 2),
        "goods_penalty": round(goods_penalty, 1),
        "has_hard_safety_conflict": has_hard_safety_conflict
    }
