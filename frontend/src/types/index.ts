export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type ProjectStatus = 'COMPLETED' | 'IN_PROGRESS' | 'DELAYED' | 'STALLED' | 'SANCTIONED';
export type UserRole = 'ADMIN' | 'ANALYST' | 'INVESTIGATOR' | 'VIEWER';
export type AlertStatus = 'NEW' | 'UNDER_REVIEW' | 'INVESTIGATION_RECOMMENDED' | 'RESOLVED' | 'DISMISSED';
export type DuplicateStatus = 'FLAGGED' | 'CONFIRMED_DISTINCT' | 'CONFIRMED_DUPLICATE' | 'UNDER_REVIEW';

export interface User {
  id: number;
  email: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  role: UserRole;
  user_id: number;
  full_name: string;
  email: string;
}

export interface FinancialRecord {
  id: number;
  project_id: string;
  transaction_type: string;
  amount: number;
  date: string;
  description?: string;
  payee?: string;
  reference_number?: string;
}

export interface ProgressRecord {
  id: number;
  project_id: string;
  inspection_date: string;
  physical_percentage: number;
  financial_percentage: number;
  remarks?: string;
  inspector_name?: string;
  photos_count: number;
}

export interface RiskScore {
  id: number;
  project_id: string;
  overall_score: number;
  risk_level: RiskLevel;
  cost_risk: number;
  delay_risk: number;
  progress_gap_risk: number;
  payment_risk: number;
  duplicate_risk: number;
  geo_risk: number;
  ml_risk: number;
  reasons_json: string;
  updated_at?: string;
}

export interface Alert {
  id: number;
  project_id: string;
  alert_type: string;
  severity: RiskLevel;
  title: string;
  description: string;
  status: AlertStatus;
  assigned_to?: string;
  resolution_notes?: string;
  created_at: string;
  updated_at?: string;
  project_title?: string;
  state?: string;
  district?: string;
  project_type?: string;
  risk_score?: number;
}

export interface DuplicateCandidate {
  id: number;
  project_a_id: string;
  project_b_id: string;
  semantic_similarity: number;
  distance_km: number;
  duplicate_score: number;
  status: DuplicateStatus;
  notes?: string;
  created_at?: string;
  other_project_title?: string;
  other_project_state?: string;
  other_project_district?: string;
}

export interface Project {
  project_id: string;
  mp_id: string;
  state: string;
  district: string;
  constituency: string;
  project_type: string;
  description: string;
  latitude: number;
  longitude: number;
  estimated_cost: number;
  sanctioned_amount: number;
  released_amount: number;
  expenditure: number;
  start_date: string;
  expected_completion_date: string;
  actual_completion_date?: string;
  physical_progress: number;
  financial_progress: number;
  implementing_agency: string;
  status: ProjectStatus;
  synthetic_label: number;
  created_at?: string;
  updated_at?: string;
  
  risk_score?: RiskScore;
  alerts_count: number;
  cost_escalation_pct: number;
  delay_days: number;
  progress_gap_pct: number;
}

export interface ProjectDetail extends Project {
  financial_records: FinancialRecord[];
  progress_records: ProgressRecord[];
  alerts: Alert[];
  duplicates: DuplicateCandidate[];
  ai_explanation?: string;
  recommended_actions: string[];
}

export interface NearbyProject {
  project_id: string;
  description: string;
  project_type: string;
  distance_km: number;
  distance_meters: number;
  latitude: number;
  longitude: number;
  sanctioned_amount: number;
  expenditure: number;
  physical_progress: number;
  financial_progress: number;
  status: ProjectStatus;
  mp_id: string;
  implementing_agency: string;
  district: string;
  state: string;
  constituency: string;
  risk_level: RiskLevel;
  overall_score: number;
  reasons?: string[];
}

export interface GisMarker {
  project_id: string;
  latitude: number;
  longitude: number;
  state: string;
  district: string;
  constituency: string;
  project_type: string;
  mp_id?: string;
  implementing_agency?: string;
  description: string;
  sanctioned_amount: number;
  expenditure: number;
  physical_progress: number;
  financial_progress: number;
  status: ProjectStatus;
  risk_level: RiskLevel;
  overall_score: number;
  primary_reason: string;
}


export interface RiskDistributionItem {
  name: string;
  count: number;
  percentage: number;
  color: string;
}

export interface StateOverviewItem {
  state: string;
  total_projects: number;
  total_sanctioned?: number;
  total_expenditure: number;
  high_risk_count: number;
  critical_risk_count: number;
  avg_delay_days: number;
}

export interface DistrictRiskItem {
  district: string;
  state: string;
  total_projects: number;
  high_risk_count: number;
  avg_risk_score: number;
}

export interface ProjectTypeDistributionItem {
  project_type: string;
  count: number;
  total_expenditure: number;
  avg_progress: number;
}

export interface DelayHistogramItem {
  range_label: string;
  count: number;
}

export interface AnomalyCategoryCount {
  category: string;
  count: number;
  percentage: number;
  severity_distribution: Record<string, number>;
}

export interface QuarterlyProgressionItem {
  quarter: string;
  sanctioned_crores: number;
  expenditure_crores: number;
}

export interface DashboardOverview {
  total_projects: number;
  total_expenditure_crores: number;
  total_sanctioned_crores: number;
  low_risk_count: number;
  medium_risk_count: number;
  high_risk_count: number;
  critical_risk_count: number;
  delayed_projects_count: number;
  cost_overrun_count: number;
  potential_duplicates_count: number;
  active_alerts_count: number;
  risk_distribution: RiskDistributionItem[];
  state_overview: StateOverviewItem[];
  district_risks: DistrictRiskItem[];
  project_types: ProjectTypeDistributionItem[];
  delay_distribution: DelayHistogramItem[];
  anomaly_categories: AnomalyCategoryCount[];
  quarterly_progression?: QuarterlyProgressionItem[];
  filter_options: {
    states: string[];
    districts: string[];
    constituencies: string[];
    project_types: string[];
    agencies: string[];
    statuses: string[];
  };
}

export interface FeatureImportanceItem {
  feature: string;
  importance: number;
}

export interface ConfusionMatrixData {
  tn: number;
  fp: number;
  fn: number;
  tp: number;
}

export interface ModelRun {
  id: number;
  model_name: string;
  model_type: string;
  accuracy?: number;
  precision?: number;
  recall?: number;
  f1_score?: number;
  roc_auc?: number;
  confusion_matrix?: ConfusionMatrixData;
  feature_importance: FeatureImportanceItem[];
  hyperparameters: Record<string, any>;
  is_active: boolean;
  trained_at: string;
}

export interface ModelComparisonResponse {
  models: ModelRun[];
  best_model_name: string;
  selection_metric: string;
  evaluation_criteria_notes: string;
  isolation_forest_summary: Record<string, any>;
  training_samples_count: number;
  positive_labels_count: number;
  disclaimer: string;
}

export interface ProjectCardData {
  project_id: string;
  state: string;
  district: string;
  project_type: string;
  description: string;
  estimated_cost: number;
  expenditure: number;
  physical_progress: number;
  financial_progress: number;
  risk_level: RiskLevel;
  overall_score: number;
  key_reasons: string[];
}

export interface AIQueryResponse {
  query: string;
  interpretation: string;
  answer_markdown: string;
  structured_data?: Record<string, any>;
  matched_projects: ProjectCardData[];
  suggested_followups: string[];
  execution_time_ms: number;
}

export interface ValidationErrorItem {
  row_number: number;
  field_name: string;
  rejected_value: any;
  reason: string;
}

export interface IngestionSummary {
  total_records: number;
  valid_records: number;
  invalid_records: number;
  duplicate_records: number;
  missing_fields_count: number;
  data_quality_score: number;
  normalized_states_count: number;
  normalized_currencies_count: number;
  validation_errors: ValidationErrorItem[];
  message: string;
}
