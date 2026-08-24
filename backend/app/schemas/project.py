from typing import Optional, List
from pydantic import BaseModel
from datetime import datetime


class FinancialRecordOut(BaseModel):
    id: int
    project_id: str
    transaction_type: str
    amount: float
    date: datetime
    description: Optional[str] = None
    payee: Optional[str] = None
    reference_number: Optional[str] = None

    class Config:
        from_attributes = True


class ProgressRecordOut(BaseModel):
    id: int
    project_id: str
    inspection_date: datetime
    physical_percentage: float
    financial_percentage: float
    remarks: Optional[str] = None
    inspector_name: Optional[str] = None
    photos_count: int = 0

    class Config:
        from_attributes = True


class RiskScoreOut(BaseModel):
    id: int
    project_id: str
    overall_score: float
    risk_level: str
    cost_risk: float
    delay_risk: float
    progress_gap_risk: float
    payment_risk: float
    duplicate_risk: float
    geo_risk: float
    ml_risk: float
    reasons_json: str
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class AlertOut(BaseModel):
    id: int
    project_id: str
    alert_type: str
    severity: str
    title: str
    description: str
    status: str
    assigned_to: Optional[str] = None
    resolution_notes: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class DuplicateCandidateOut(BaseModel):
    id: int
    project_a_id: str
    project_b_id: str
    semantic_similarity: float
    distance_km: float
    duplicate_score: float
    status: str
    notes: Optional[str] = None
    created_at: Optional[datetime] = None
    other_project_title: Optional[str] = None
    other_project_state: Optional[str] = None
    other_project_district: Optional[str] = None

    class Config:
        from_attributes = True


class ProjectOut(BaseModel):
    project_id: str
    mp_id: str
    state: str
    district: str
    constituency: str
    project_type: str
    description: str
    latitude: float
    longitude: float
    estimated_cost: float
    sanctioned_amount: float
    released_amount: float
    expenditure: float
    start_date: datetime
    expected_completion_date: datetime
    actual_completion_date: Optional[datetime] = None
    physical_progress: float
    financial_progress: float
    implementing_agency: str
    status: str
    synthetic_label: int = 0
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    
    # Calculated / joined fields
    risk_score: Optional[RiskScoreOut] = None
    alerts_count: int = 0
    cost_escalation_pct: float = 0.0
    delay_days: int = 0
    progress_gap_pct: float = 0.0

    class Config:
        from_attributes = True


class ProjectDetailOut(ProjectOut):
    financial_records: List[FinancialRecordOut] = []
    progress_records: List[ProgressRecordOut] = []
    alerts: List[AlertOut] = []
    duplicates: List[DuplicateCandidateOut] = []
    ai_explanation: Optional[str] = None
    recommended_actions: List[str] = []


class ProjectFilter(BaseModel):
    state: Optional[str] = None
    district: Optional[str] = None
    constituency: Optional[str] = None
    project_type: Optional[str] = None
    risk_level: Optional[str] = None
    status: Optional[str] = None
    implementing_agency: Optional[str] = None
    search: Optional[str] = None
    min_cost_escalation: Optional[float] = None
    min_delay_days: Optional[int] = None
    limit: int = 50
    offset: int = 0


class ProjectAdminUpdate(BaseModel):
    status: Optional[str] = None
    sanctioned_amount: Optional[float] = None
    expenditure: Optional[float] = None
    released_amount: Optional[float] = None
    physical_progress: Optional[float] = None
    order_reference: Optional[str] = None
    administrative_remarks: Optional[str] = None


class InvestigationReportCreate(BaseModel):
    physical_verified_pct: float
    site_status: str
    findings_summary: str
    irregularities_observed: Optional[List[str]] = []
    recommendation: str
    inspector_name: Optional[str] = "Vigilance Officer"
    document_ref: Optional[str] = None


class AnalystVerificationCreate(BaseModel):
    statistical_risk_assessment: str
    confidence_score: float
    anomaly_indicators: Optional[List[str]] = []
    escalation_reason: str
    recommended_admin_action: str
    analyst_name: Optional[str] = "Chief Data Analyst"
