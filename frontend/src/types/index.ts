export interface Station {
  station_code: string;
  station_name: string;
  station_type: string;      // Major, Junction, Intermediate, Terminal, Halt
  division: string;
  zone: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  platforms: number;
  lines: number;
  electrified: string;       // Yes, No
  status: string;            // Active, Inactive
}

export interface RailwaySection {
  section_id: string;
  from_station: string;
  to_station: string;
  from_code?: string;
  to_code?: string;
  distance_km: number;
  tracks_count: number;
  electrified: string;
  max_speed_kmh: number;
  permitted_block_duration: number;
  status: string;
}

export interface MaintenanceTask {
  task_id: string;
  department: string;
  asset_id: string;
  section: string;
  location: string;
  task_type: string;
  description: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  asset_criticality: 'Critical' | 'High' | 'Medium' | 'Low';
  due_date: string;
  overdue_days: number;
  estimated_duration_hours: number;
  required_team: string;
  status: 'Pending' | 'Overdue' | 'Scheduled' | 'Completed';
  requires_power_block: boolean;
  requires_traffic_block: boolean;
  priority_score?: number;
  priority_level?: 'Critical' | 'High' | 'Medium' | 'Low';
  score_reasons?: string[];
  score_breakdown?: Record<string, number>;
}

export interface Train {
  train_id: string;
  train_number: string;
  train_name: string;
  train_type: 'Express' | 'Superfast' | 'Passenger' | 'MEMU' | 'DEMU' | 'Goods' | 'Special';
  origin_station?: string;
  destination_station?: string;
  section: string;
  arrival_time: string;
  departure_time: string;
  date?: string;
  priority: number;
  priority_label?: 'Critical' | 'High' | 'Medium' | 'Low';
  direction?: string;
  running_status: 'Scheduled' | 'Delayed' | 'Cancelled' | 'Completed';
  expected: string;
  remarks?: string;
}

export interface GoodsForecast {
  forecast_id: string;
  section: string;
  expected_start_time: string;
  expected_end_time: string;
  probability: number;
  traffic_level: 'Low' | 'Medium' | 'High';
}

export interface BlockAvailability {
  block_id: string;
  section: string;
  date: string;
  start_time: string;
  end_time: string;
  maximum_duration: number;
  status: 'Available' | 'Allocated' | 'Cancelled';
}

export interface RecommendedBlock {
  recommendation_id: string;
  block_id: string;
  section: string;
  section_name?: string;
  date: string;
  start_time: string;
  end_time: string;
  duration_hours: number;
  tasks: MaintenanceTask[];
  task_ids: string[];
  departments: string[];
  priority_level: 'Critical' | 'High' | 'Medium' | 'Low';
  optimization_score: number;
  train_impact_score: number;
  affected_trains_count: number;
  affected_trains?: any[];
  goods_probability: number;
  reasons: string[];
  score_breakdown: Record<string, number>;
  status: 'Proposed' | 'Accepted' | 'Rejected';
}

export interface OptimizationConfig {
  horizon: 'Daily' | 'Weekly' | 'Monthly';
  target_date?: string;
  section_filter?: string;
  selected_task_ids?: string[];
  min_priority?: string;
  train_disruption_tolerance: 'Low' | 'Medium' | 'High';
  enable_multi_dept_grouping: boolean;
}

export interface ManualBlockRequest {
  date: string;
  section: string;
  start_time: string;
  end_time: string;
  task_ids: string[];
  remarks?: string;
}

export interface PlanMetrics {
  total_eligible_tasks: number;
  scheduled_tasks: number;
  task_completion_rate: number;
  total_critical_tasks: number;
  critical_tasks_scheduled: number;
  critical_completion_rate: number;
  total_blocks_used: number;
  total_block_hours: number;
  available_block_hours: number;
  block_utilization_rate: number;
  train_disruption_score: number;
  trains_affected_count: number;
  overdue_tasks_remaining: number;
  multi_dept_blocks_count: number;
  average_asset_availability: number;
}

export interface ComparisonResult {
  manual_plan: PlanMetrics;
  ai_plan: PlanMetrics;
  blocks_saved: number;
  block_reduction_pct: number;
  hours_saved: number;
  hours_reduction_pct: number;
  additional_tasks_completed: number;
  train_disruption_reduction_pct: number;
  overdue_reduction_pct: number;
  asset_availability_gain_pct: number;
}
