"""
Scenario Simulation Router for RailOpt-AI.
Enables What-If simulations for traffic surges, goods forecasts, capacity caps, and emergency tasks.
"""
from fastapi import APIRouter
from typing import List, Dict, Any
from models.domain import SimulationRequest, OptimizationConfig, RecommendedBlock, PlanMetrics, Train, GoodsForecast, BlockAvailability, MaintenanceTask
from routers.optimizer import load_environment_data
from optimizer.block_optimizer import run_ai_block_optimization
from optimizer.metrics import compute_plan_comparison
import copy

router = APIRouter(prefix="/api/simulate", tags=["Scenario Simulator"])

@router.post("")
def run_simulation(sim: SimulationRequest):
    base_tasks, base_trains, base_forecasts, base_blocks = load_environment_data()
    
    # --- 1. Scenario A: Current Standard Plan ---
    cfg_a = OptimizationConfig(horizon="Daily", target_date="2026-08-30")
    recs_a, metrics_a = run_ai_block_optimization(base_tasks, base_blocks, base_trains, base_forecasts, cfg_a)

    # --- 2. Scenario B: Modified What-If Environment ---
    sim_tasks = copy.deepcopy(base_tasks)
    sim_trains = copy.deepcopy(base_trains)
    sim_forecasts = copy.deepcopy(base_forecasts)
    sim_blocks = copy.deepcopy(base_blocks)

    # Add emergency tasks
    for em in sim.emergency_tasks:
        sim_tasks.append(em)

    # Apply Goods Traffic Multiplier
    for gf in sim_forecasts:
        gf.probability = min(1.0, round(gf.probability * sim.goods_traffic_multiplier, 2))

    # Apply Available Block Hours Factor
    for b in sim_blocks:
        b.maximum_duration = round(b.maximum_duration * sim.available_block_hours_factor, 1)

    # Adjust Train Traffic Density
    if sim.train_traffic_density in ["High", "Congested"]:
        # Add dense freight / special paths in midday windows
        sim_trains.append(Train(
            train_id="SIM-EXTRA-01",
            train_number="SPL-CON-99",
            train_name="Simulated Fast Freight Surge",
            train_type="Goods",
            section="WL-BZA",
            arrival_time="13:15",
            departure_time="14:45",
            priority=3,
            expected="Simulated"
        ))
        if sim.train_traffic_density == "Congested":
            sim_trains.append(Train(
                train_id="SIM-EXTRA-02",
                train_number="12700",
                train_name="Special Superfast Surge",
                train_type="Express",
                section="SEC-KZJ",
                arrival_time="12:00",
                departure_time="13:30",
                priority=2,
                expected="Simulated"
            ))

    # Run AI Optimization for Scenario B
    tolerance = "Low" if sim.train_traffic_density == "Congested" else ("High" if sim.train_traffic_density == "Low" else "Medium")
    cfg_b = OptimizationConfig(
        horizon="Daily",
        target_date="2026-08-30",
        train_disruption_tolerance=tolerance
    )
    recs_b, metrics_b = run_ai_block_optimization(sim_tasks, sim_blocks, sim_trains, sim_forecasts, cfg_b)

    # Summarize Differences
    diff_summary = {
        "blocks_count_change": len(recs_b) - len(recs_a),
        "tasks_scheduled_change": metrics_b.scheduled_tasks - metrics_a.scheduled_tasks,
        "train_disruption_change": round(metrics_b.train_disruption_score - metrics_a.train_disruption_score, 1),
        "asset_availability_change": round(metrics_b.average_asset_availability - metrics_a.average_asset_availability, 1)
    }

    insights = []
    if sim.train_traffic_density in ["High", "Congested"]:
        insights.append("Increased train traffic density prompted the optimizer to shift blocks or select tighter parallel multi-department groupings to protect express slots.")
    if sim.available_block_hours_factor < 1.0:
        insights.append(f"Restricted block window durations ({int(sim.available_block_hours_factor*100)}%) forced the engine to prioritize critical defects over routine tamping.")
    if len(sim.emergency_tasks) > 0:
        insights.append(f"Injected {len(sim.emergency_tasks)} emergency task(s), which immediately took precedence in prime available windows.")
    if not insights:
        insights.append("Plan adjusted dynamically to current traffic and criticality constraints.")

    return {
        "scenario_a": {
            "title": "Scenario A (Current Baseline Plan)",
            "traffic_density": "Normal",
            "recommendations": recs_a,
            "metrics": metrics_a
        },
        "scenario_b": {
            "title": "Scenario B (What-If Simulated Plan)",
            "traffic_density": sim.train_traffic_density,
            "goods_multiplier": sim.goods_traffic_multiplier,
            "recommendations": recs_b,
            "metrics": metrics_b
        },
        "diff_summary": diff_summary,
        "insights": insights
    }
