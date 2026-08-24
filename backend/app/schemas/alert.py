from typing import Optional
from pydantic import BaseModel
from datetime import datetime


class AlertStatusUpdate(BaseModel):
    status: str  # NEW, UNDER_REVIEW, INVESTIGATION_RECOMMENDED, RESOLVED, DISMISSED
    resolution_notes: Optional[str] = None
    assigned_to: Optional[str] = None


class AlertCreate(BaseModel):
    project_id: str
    alert_type: str
    severity: str
    title: str
    description: str


class AlertDetailOut(BaseModel):
    id: int
    project_id: str
    project_title: Optional[str] = None
    state: Optional[str] = None
    district: Optional[str] = None
    project_type: Optional[str] = None
    alert_type: str
    severity: str
    title: str
    description: str
    status: str
    assigned_to: Optional[str] = None
    resolution_notes: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    risk_score: Optional[float] = None

    class Config:
        from_attributes = True
