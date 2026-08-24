import {
  AuthResponse, DashboardOverview, Project, ProjectDetail, GisMarker,
  Alert, DuplicateCandidate, ModelComparisonResponse, AIQueryResponse,
  IngestionSummary, FinancialRecord, NearbyProject
} from '../types';


const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('mplads_auth_token');
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export const api = {
  // Authentication
  async login(email: string, password: string): Promise<AuthResponse> {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Login failed');
    }
    return res.json();
  },

  async demoLogin(role: string): Promise<AuthResponse> {
    const res = await fetch(`${API_BASE_URL}/auth/demo-login/${role.toLowerCase()}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Demo login failed');
    }
    return res.json();
  },

  async prototypeLogin(email: string, role: string, fullName?: string): Promise<AuthResponse> {
    const res = await fetch(`${API_BASE_URL}/auth/prototype-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, role, full_name: fullName }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Prototype login failed');
    }
    return res.json();
  },

  async getMe() {
    const res = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch profile');
    return res.json();
  },

  // Analytics Overview
  async getOverview(): Promise<DashboardOverview> {
    const res = await fetch(`${API_BASE_URL}/analytics/overview`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch dashboard analytics');
    return res.json();
  },

  // Projects
  async listProjects(params: Record<string, any> = {}): Promise<Project[]> {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        query.append(key, String(val));
      }
    });
    const res = await fetch(`${API_BASE_URL}/projects?${query.toString()}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch projects');
    return res.json();
  },

  async getProjectDetail(projectId: string): Promise<ProjectDetail> {
    const res = await fetch(`${API_BASE_URL}/projects/${projectId}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error(`Failed to fetch details for project ${projectId}`);
    return res.json();
  },

  async getProjectTransactions(projectId: string): Promise<FinancialRecord[]> {
    const res = await fetch(`${API_BASE_URL}/projects/${projectId}/transactions`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error(`Failed to fetch transactions for project ${projectId}`);
    return res.json();
  },


  async getFilterOptions(): Promise<{ states: string[]; project_types: string[]; statuses: string[]; risk_levels: string[] }> {
    const res = await fetch(`${API_BASE_URL}/projects/filter-options`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch filter options');
    return res.json();
  },


  async getGisMarkers(params: Record<string, any> = {}): Promise<GisMarker[]> {

    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        query.append(key, String(val));
      }
    });
    const res = await fetch(`${API_BASE_URL}/projects/gis/markers?${query.toString()}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch GIS markers');
    return res.json();
  },

  async getNearbyProjects(projectId: string, radiusKm: number = 2.0): Promise<NearbyProject[]> {
    const res = await fetch(`${API_BASE_URL}/projects/${projectId}/nearby?radius_km=${radiusKm}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch nearby projects');
    return res.json();
  },

  async adminUpdateProject(projectId: string, data: any): Promise<ProjectDetail> {
    const res = await fetch(`${API_BASE_URL}/projects/${projectId}`, {
      method: 'PUT',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to update project master record');
    }
    return res.json();
  },

  async submitInvestigationReport(projectId: string, data: any): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/projects/${projectId}/investigation-report`, {
      method: 'POST',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to submit field investigation report');
    }
    return res.json();
  },

  async submitAnalystVerification(projectId: string, data: any): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/projects/${projectId}/analyst-verification`, {
      method: 'POST',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to submit analyst verification');
    }
    return res.json();
  },

  // Alerts & Investigation Center
  async listAlerts(statusFilter?: string, severity?: string): Promise<Alert[]> {
    const query = new URLSearchParams();
    if (statusFilter) query.append('status_filter', statusFilter);
    if (severity) query.append('severity', severity);
    const res = await fetch(`${API_BASE_URL}/alerts?${query.toString()}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch alerts');
    return res.json();
  },

  async updateAlertStatus(alertId: number, status: string, notes?: string, assignedTo?: string) {
    const res = await fetch(`${API_BASE_URL}/alerts/${alertId}/status`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        status,
        resolution_notes: notes,
        assigned_to: assignedTo,
      }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to update alert status');
    }
    return res.json();
  },

  // Duplicate Detection
  async listDuplicates(statusFilter?: string): Promise<DuplicateCandidate[]> {
    const query = new URLSearchParams();
    if (statusFilter) query.append('status_filter', statusFilter);
    const res = await fetch(`${API_BASE_URL}/duplicates?${query.toString()}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch duplicates');
    return res.json();
  },

  async updateDuplicateStatus(candidateId: number, statusVal: string, notes?: string) {
    const query = new URLSearchParams({ status_val: statusVal });
    if (notes) query.append('notes', notes);
    const res = await fetch(`${API_BASE_URL}/duplicates/${candidateId}/status?${query.toString()}`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to update duplicate status');
    return res.json();
  },

  // Machine Learning & Model Analytics
  async getModelBenchmarks(): Promise<ModelComparisonResponse> {
    const res = await fetch(`${API_BASE_URL}/ml/models`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch ML model benchmarks');
    return res.json();
  },

  async trainModels(): Promise<ModelComparisonResponse> {
    const res = await fetch(`${API_BASE_URL}/ml/train`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to train ML models');
    return res.json();
  },

  // Controlled AI Assistant
  async askAiAssistant(query: string, contextProjectId?: string): Promise<AIQueryResponse> {
    const res = await fetch(`${API_BASE_URL}/ai/query`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        query,
        context_project_id: contextProjectId,
      }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to process AI query');
    }
    return res.json();
  },

  // Ingestion & Normalization
  async uploadFile(file: File): Promise<IngestionSummary> {
    const token = localStorage.getItem('mplads_auth_token');
    const formData = new FormData();
    formData.append('file', file);

    const headers: HeadersInit = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${API_BASE_URL}/ingestion/upload`, {
      method: 'POST',
      headers,
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'File upload failed');
    }
    return res.json();
  },

  async resetDemoData() {
    const res = await fetch(`${API_BASE_URL}/ingestion/reset-demo`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to reset demo dataset');
    return res.json();
  },

  getSampleCsvUrl(): string {
    return `${API_BASE_URL}/ingestion/sample-csv`;
  },

  // Risk Engine Thresholds
  async getRiskThresholds() {
    const res = await fetch(`${API_BASE_URL}/risk/thresholds`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch risk thresholds');
    return res.json();
  },

  async recalculateRisk(thresholds: Record<string, any> = {}) {
    const res = await fetch(`${API_BASE_URL}/risk/recalculate`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(thresholds),
    });
    if (!res.ok) throw new Error('Failed to recalculate risks');
    return res.json();
  },
};

