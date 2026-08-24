from typing import List, Dict, Any
from pydantic import BaseModel


class RiskDistributionItem(BaseModel):
    name: str
    count: int
    percentage: float
    color: str


class StateOverviewItem(BaseModel):
    state: str
    total_projects: int
    total_sanctioned: float = 0.0
    total_expenditure: float
    high_risk_count: int
    critical_risk_count: int
    avg_delay_days: float


class DistrictRiskItem(BaseModel):
    district: str
    state: str
    total_projects: int
    high_risk_count: int
    avg_risk_score: float


class ProjectTypeDistributionItem(BaseModel):
    project_type: str
    count: int
    total_expenditure: float
    avg_progress: float


class DelayHistogramItem(BaseModel):
    range_label: str  # "On Time / Early", "1 - 30 Days", "31 - 90 Days", "91 - 180 Days", ">180 Days"
    count: int


class AnomalyCategoryCount(BaseModel):
    category: str
    count: int
    percentage: float
    severity_distribution: Dict[str, int]


class QuarterlyProgressionItem(BaseModel):
    quarter: str
    sanctioned_crores: float
    expenditure_crores: float


class OverviewDashboardOut(BaseModel):
    total_projects: int
    total_expenditure_crores: float
    total_sanctioned_crores: float
    low_risk_count: int
    medium_risk_count: int
    high_risk_count: int
    critical_risk_count: int
    delayed_projects_count: int
    cost_overrun_count: int
    potential_duplicates_count: int
    active_alerts_count: int
    
    risk_distribution: List[RiskDistributionItem]
    state_overview: List[StateOverviewItem]
    district_risks: List[DistrictRiskItem]
    project_types: List[ProjectTypeDistributionItem]
    delay_distribution: List[DelayHistogramItem]
    anomaly_categories: List[AnomalyCategoryCount]
    quarterly_progression: List[QuarterlyProgressionItem] = []
    filter_options: Dict[str, List[str]]
