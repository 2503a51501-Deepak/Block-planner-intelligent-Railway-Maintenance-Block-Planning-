import {
  Station,
  RailwaySection,
  Train,
  MaintenanceTask,
  BlockAvailability,
  RecommendedBlock,
  OptimizationConfig,
  PlanMetrics,
  ComparisonResult,
  GoodsForecast,
  ManualBlockRequest
} from '../types';

const API_BASE = '/api';

async function handleResponse<T>(res: Response, fallbackError: string): Promise<T> {
  if (!res.ok) {
    let detail = fallbackError;
    try {
      const err = await res.json();
      detail = err.detail || err.error || err.message || fallbackError;
    } catch {
      // ignore
    }
    throw new Error(detail);
  }
  return res.json();
}

export const api = {
  // --- Stations & Sections ---
  async getStations(params?: { search?: string; station_type?: string; status?: string }): Promise<Station[]> {
    const query = new URLSearchParams();
    if (params?.search) query.append('search', params.search);
    if (params?.station_type && params.station_type !== 'All') query.append('station_type', params.station_type);
    if (params?.status && params.status !== 'All') query.append('status', params.status);
    const res = await fetch(`${API_BASE}/stations?${query.toString()}`);
    return handleResponse<Station[]>(res, 'Failed to fetch stations');
  },

  async createStation(station: Station): Promise<Station> {
    const res = await fetch(`${API_BASE}/stations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(station)
    });
    return handleResponse<Station>(res, 'Failed to create station');
  },

  async updateStation(code: string, station: Station): Promise<Station> {
    const res = await fetch(`${API_BASE}/stations/${code}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(station)
    });
    return handleResponse<Station>(res, 'Failed to update station');
  },

  async deleteStation(code: string): Promise<void> {
    const res = await fetch(`${API_BASE}/stations/${code}`, { method: 'DELETE' });
    await handleResponse<{ message: string }>(res, 'Failed to delete station');
  },

  async getSections(status?: string): Promise<RailwaySection[]> {
    const query = status && status !== 'All' ? `?status=${status}` : '';
    const res = await fetch(`${API_BASE}/sections${query}`);
    return handleResponse<RailwaySection[]>(res, 'Failed to fetch sections');
  },

  async createSection(sec: RailwaySection): Promise<RailwaySection> {
    const res = await fetch(`${API_BASE}/sections`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sec)
    });
    return handleResponse<RailwaySection>(res, 'Failed to create section');
  },

  async updateSection(id: string, sec: RailwaySection): Promise<RailwaySection> {
    const res = await fetch(`${API_BASE}/sections/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sec)
    });
    return handleResponse<RailwaySection>(res, 'Failed to update section');
  },

  async deleteSection(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/sections/${id}`, { method: 'DELETE' });
    await handleResponse<{ message: string }>(res, 'Failed to delete section');
  },

  // --- Tasks ---
  async getTasks(params?: { department?: string; severity?: string; section?: string; status?: string; search?: string }): Promise<MaintenanceTask[]> {
    const query = new URLSearchParams();
    if (params?.department && params.department !== 'All') query.append('department', params.department);
    if (params?.severity && params.severity !== 'All') query.append('severity', params.severity);
    if (params?.section && params.section !== 'All') query.append('section', params.section);
    if (params?.status && params.status !== 'All') query.append('status', params.status);
    if (params?.search) query.append('search', params.search);
    const res = await fetch(`${API_BASE}/tasks?${query.toString()}`);
    return handleResponse<MaintenanceTask[]>(res, 'Failed to fetch maintenance tasks');
  },

  async createTask(task: MaintenanceTask): Promise<MaintenanceTask> {
    const res = await fetch(`${API_BASE}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(task)
    });
    return handleResponse<MaintenanceTask>(res, 'Failed to create task');
  },

  async updateTask(id: string, task: MaintenanceTask): Promise<MaintenanceTask> {
    const res = await fetch(`${API_BASE}/tasks/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(task)
    });
    return handleResponse<MaintenanceTask>(res, 'Failed to update task');
  },

  async deleteTask(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/tasks/${id}`, { method: 'DELETE' });
    await handleResponse<{ message: string }>(res, 'Failed to delete task');
  },

  // --- Trains ---
  async getTrains(params?: { section?: string; train_type?: string; priority?: number; running_status?: string; search?: string }): Promise<Train[]> {
    const query = new URLSearchParams();
    if (params?.section && params.section !== 'All') query.append('section', params.section);
    if (params?.train_type && params.train_type !== 'All') query.append('train_type', params.train_type);
    if (params?.priority) query.append('priority', params.priority.toString());
    if (params?.running_status && params.running_status !== 'All') query.append('running_status', params.running_status);
    if (params?.search) query.append('search', params.search);
    const res = await fetch(`${API_BASE}/trains?${query.toString()}`);
    return handleResponse<Train[]>(res, 'Failed to fetch trains');
  },

  async createTrain(train: Train): Promise<Train> {
    const res = await fetch(`${API_BASE}/trains`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(train)
    });
    return handleResponse<Train>(res, 'Failed to create train');
  },

  async updateTrain(id: string, train: Train): Promise<Train> {
    const res = await fetch(`${API_BASE}/trains/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(train)
    });
    return handleResponse<Train>(res, 'Failed to update train');
  },

  async deleteTrain(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/trains/${id}`, { method: 'DELETE' });
    await handleResponse<{ message: string }>(res, 'Failed to delete train');
  },

  async getGoodsForecast(section?: string): Promise<GoodsForecast[]> {
    const query = section && section !== 'All' ? `?section=${section}` : '';
    const res = await fetch(`${API_BASE}/trains/goods-forecast${query}`);
    return handleResponse<GoodsForecast[]>(res, 'Failed to fetch goods forecast');
  },

  // --- Blocks & Optimization ---
  async getBlocks(section?: string, date?: string): Promise<BlockAvailability[]> {
    const query = new URLSearchParams();
    if (section && section !== 'All') query.append('section', section);
    if (date) query.append('date', date);
    const res = await fetch(`${API_BASE}/blocks?${query.toString()}`);
    return handleResponse<BlockAvailability[]>(res, 'Failed to fetch block windows');
  },

  async validateManualBlock(req: ManualBlockRequest): Promise<any> {
    const res = await fetch(`${API_BASE}/blocks/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req)
    });
    return handleResponse<any>(res, 'Validation failed');
  },

  async createManualBlock(req: ManualBlockRequest): Promise<RecommendedBlock> {
    const res = await fetch(`${API_BASE}/blocks/manual`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req)
    });
    return handleResponse<RecommendedBlock>(res, 'Failed to create manual block');
  },

  async runOptimization(config: OptimizationConfig): Promise<{
    recommendations: RecommendedBlock[];
    metrics: PlanMetrics;
    manual_metrics: PlanMetrics;
    recommendations_count: number;
  }> {
    const res = await fetch(`${API_BASE}/optimize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config)
    });
    return handleResponse<any>(res, 'Failed to run optimization');
  },

  async getRecommendations(): Promise<RecommendedBlock[]> {
    const res = await fetch(`${API_BASE}/recommendations`);
    return handleResponse<RecommendedBlock[]>(res, 'Failed to fetch recommendations');
  },

  async acceptRecommendation(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/recommendations/${id}/accept`, { method: 'POST' });
    await handleResponse<{ message: string }>(res, 'Failed to accept recommendation');
  },

  async rejectRecommendation(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/recommendations/${id}/reject`, { method: 'POST' });
    await handleResponse<{ message: string }>(res, 'Failed to reject recommendation');
  },

  // --- Analytics & Plans ---
  async getDashboardAnalytics(): Promise<any> {
    const res = await fetch(`${API_BASE}/analytics/dashboard`);
    return handleResponse<any>(res, 'Failed to fetch dashboard data');
  },

  async getWeeklyPlan(): Promise<any> {
    const res = await fetch(`${API_BASE}/analytics/weekly-plan`);
    return handleResponse<any>(res, 'Failed to fetch weekly plan');
  },

  async getMonthlyPlan(): Promise<any> {
    const res = await fetch(`${API_BASE}/analytics/monthly-plan`);
    return handleResponse<any>(res, 'Failed to fetch monthly plan');
  },

  async getComparison(): Promise<ComparisonResult> {
    const res = await fetch(`${API_BASE}/analytics/comparison`);
    return handleResponse<ComparisonResult>(res, 'Failed to fetch comparison');
  },

  async resetDemoData(): Promise<void> {
    const res = await fetch(`${API_BASE}/data/reset-demo`, { method: 'POST' });
    await handleResponse<{ message: string }>(res, 'Failed to reset demo data');
  }
};
