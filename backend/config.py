"""
Block Planner Configuration
Default weights, thresholds, and corridor metadata.
"""
from typing import Dict, List
from pydantic import BaseModel

class PriorityWeights(BaseModel):
    severity: float = 0.35
    asset_criticality: float = 0.25
    overdue_factor: float = 0.20
    train_impact: float = 0.20

class OptimizerWeights(BaseModel):
    priority_gain: float = 1.0
    multi_dept_bonus: float = 15.0
    train_disruption_penalty: float = 25.0
    overdue_bonus: float = 10.0
    duration_waste_penalty: float = 5.0

class AppConfig:
    PROJECT_NAME = "Block Planner"
    SUBTITLE = "Intelligent Railway Maintenance Block Planning"
    VERSION = "2.0.0"
    SIMULATION_DISCLAIMER = "Notice: This decision-support system uses configured railway database models for planning and optimization."
    DATABASE_PATH = "railopt.db"
    
    DEFAULT_PRIORITY_WEIGHTS = PriorityWeights()
    DEFAULT_OPTIMIZER_WEIGHTS = OptimizerWeights()
    
    CORRIDOR_SECTIONS: List[Dict[str, str]] = [
        {"id": "SEC-KZJ", "name": "Secunderabad - Kazipet", "from_stn": "Secunderabad", "to_stn": "Kazipet", "length_km": "132", "track_class": "Class A (130 kmph)", "density": "High"},
        {"id": "KZJ-WL", "name": "Kazipet - Warangal", "from_stn": "Kazipet", "to_stn": "Warangal", "length_km": "15", "track_class": "Class A (130 kmph)", "density": "Very High"},
        {"id": "WL-BZA", "name": "Warangal - Vijayawada", "from_stn": "Warangal", "to_stn": "Vijayawada", "length_km": "207", "track_class": "Class A (130 kmph)", "density": "High"},
        {"id": "BZA-GNT", "name": "Vijayawada - Guntur", "from_stn": "Vijayawada", "to_stn": "Guntur", "length_km": "32", "track_class": "Class B (110 kmph)", "density": "Medium"},
    ]
    
    DEPARTMENTS: List[str] = [
        "Engineering",          # Track, P-Way, Bridges (TMS)
        "Traction",             # Electrical, OHE, Sub-stations (TDMS)
        "Signal & Telecom"      # Interlocking, Points, Signals (SMMS)
    ]

settings = AppConfig()
