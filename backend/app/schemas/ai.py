from typing import Optional, List, Dict, Any
from pydantic import BaseModel


class AIQueryRequest(BaseModel):
    query: str
    context_project_id: Optional[str] = None


class ProjectCardData(BaseModel):
    project_id: str
    state: str
    district: str
    project_type: str
    description: str
    estimated_cost: float
    expenditure: float
    physical_progress: float
    financial_progress: float
    risk_level: str
    overall_score: float
    key_reasons: List[str] = []


class AIQueryResponse(BaseModel):
    query: str
    interpretation: str
    answer_markdown: str
    structured_data: Optional[Dict[str, Any]] = None
    matched_projects: List[ProjectCardData] = []
    suggested_followups: List[str] = []
    execution_time_ms: float
