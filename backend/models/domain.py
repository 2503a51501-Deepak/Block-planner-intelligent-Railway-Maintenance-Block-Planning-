"""
Domain models and Pydantic schemas for Block Planner.
"""
from typing import List, Dict, Optional, Any
from pydantic import BaseModel, Field

class Station(BaseModel):
    station_code: str
    station_name: str
    station_type: str = "Junction"      # Major, Junction, Intermediate, Terminal, Halt
    division: str = "Secunderabad"
    zone: str = "South Central Railway"
    location: str = ""
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    platforms: int = 2
    lines: int = 4
    electrified: str = "Yes"            # Yes, No
    status: str = "Active"              # Active, Inactive

class RailwaySection(BaseModel):
    section_id: str
    from_station: str
    to_station: str
    from_code: Optional[str] = None
    to_code: Optional[str] = None
    distance_km: float = 0.0
    tracks_count: int = 2
    electrified: str = "Yes"
    max_speed_kmh: int = 130
    permitted_block_duration: float = 4.0
    status: str = "Active"

class MaintenanceTask(BaseModel):
    task_id: Optional[str] = None
    department: str                     # Engineering, Traction, Signal & Telecom
    asset_id: str
    section: str                        # SEC-KZJ, KZJ-WL, WL-BZA, BZA-GNT
    location: str
    task_type: str
    description: str
    severity: str                       # Critical, High, Medium, Low
    asset_criticality: str              # Critical, High, Medium, Low
    due_date: str                       # YYYY-MM-DD
    overdue_days: int = 0
    estimated_duration_hours: float
    required_team: str
    status: str = "Pending"             # Pending, Overdue, Scheduled, Completed
    requires_power_block: bool = False
    requires_traffic_block: bool = True
    priority_score: Optional[float] = None
    priority_level: Optional[str] = None
    score_reasons: Optional[List[str]] = None
    score_breakdown: Optional[Dict[str, float]] = None

class Train(BaseModel):
    train_id: Optional[str] = None
    train_number: str
    train_name: str
    train_type: str = "Express"         # Express, Superfast, Passenger, MEMU, DEMU, Goods, Special
    origin_station: Optional[str] = "Secunderabad"
    destination_station: Optional[str] = "Vijayawada"
    section: str
    arrival_time: str                   # HH:MM
    departure_time: str                 # HH:MM
    date: Optional[str] = "2026-08-30"
    priority: int = 2                   # 1 (Critical/Protected), 2 (High), 3 (Medium), 4 (Low)
    priority_label: Optional[str] = "High" # Critical, High, Medium, Low
    direction: Optional[str] = "Down"   # Up, Down
    running_status: str = "Scheduled"   # Scheduled, Delayed, Cancelled, Completed
    expected: str = "On Time"           # On Time, Delayed (+15m), etc.
    remarks: Optional[str] = None

class GoodsForecast(BaseModel):
    forecast_id: str
    section: str
    expected_start_time: str            # HH:MM
    expected_end_time: str              # HH:MM
    probability: float                  # 0.0 - 1.0
    traffic_level: str                  # Low, Medium, High

class BlockAvailability(BaseModel):
    block_id: str
    section: str
    date: str                           # YYYY-MM-DD
    start_time: str                     # HH:MM
    end_time: str                       # HH:MM
    maximum_duration: float             # Hours
    status: str = "Available"           # Available, Allocated, Cancelled

class RecommendedBlock(BaseModel):
    recommendation_id: str
    block_id: str
    section: str
    section_name: Optional[str] = None
    date: str
    start_time: str
    end_time: str
    duration_hours: float
    tasks: List[MaintenanceTask] = []
    task_ids: List[str] = []
    departments: List[str] = []
    priority_level: str = "High"
    optimization_score: float = 0.0
    train_impact_score: float = 0.0
    affected_trains_count: int = 0
    affected_trains: List[Dict[str, Any]] = []
    goods_probability: float = 0.0
    reasons: List[str] = []
    score_breakdown: Dict[str, float] = {}
    status: str = "Proposed"            # Proposed, Accepted, Rejected

class OptimizationConfig(BaseModel):
    horizon: str = "Daily"              # Daily, Weekly, Monthly
    target_date: Optional[str] = None
    section_filter: Optional[str] = "All"
    selected_task_ids: Optional[List[str]] = None
    min_priority: Optional[str] = "All" # All, Medium, High, Critical
    train_disruption_tolerance: str = "Medium" # Low, Medium, High
    enable_multi_dept_grouping: bool = True
    custom_severity_weight: Optional[float] = None
    custom_criticality_weight: Optional[float] = None
    custom_overdue_weight: Optional[float] = None
    custom_train_impact_weight: Optional[float] = None

class ManualBlockRequest(BaseModel):
    date: str
    section: str
    start_time: str
    end_time: str
    task_ids: List[str] = []
    remarks: Optional[str] = None

class PlanMetrics(BaseModel):
    total_eligible_tasks: int = 0
    scheduled_tasks: int = 0
    task_completion_rate: float = 0.0
    total_critical_tasks: int = 0
    critical_tasks_scheduled: int = 0
    critical_completion_rate: float = 0.0
    total_blocks_used: int = 0
    total_block_hours: float = 0.0
    available_block_hours: float = 0.0
    block_utilization_rate: float = 0.0
    train_disruption_score: float = 0.0
    trains_affected_count: int = 0
    overdue_tasks_remaining: int = 0
    multi_dept_blocks_count: int = 0
    average_asset_availability: float = 0.0

class ComparisonResult(BaseModel):
    manual_plan: PlanMetrics
    ai_plan: PlanMetrics
    blocks_saved: int
    block_reduction_pct: float
    hours_saved: float
    hours_reduction_pct: float
    additional_tasks_completed: int
    train_disruption_reduction_pct: float
    overdue_reduction_pct: float
    asset_availability_gain_pct: float

class SimulationRequest(BaseModel):
    train_traffic_density: str = "Normal"
    goods_traffic_multiplier: float = 1.0
    criticality_threshold: int = 40
    available_block_hours_factor: float = 1.0
    emergency_tasks: List[MaintenanceTask] = []

class AssetHealth(BaseModel):
    asset_id: str
    asset_name: str
    department: str
    section: str
    availability_pct: float
    downtime_hours_month: float
    pending_tasks_count: int
    critical_defects_count: int
    condition_index: str
