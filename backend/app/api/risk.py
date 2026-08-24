import json
from typing import Dict, Any, List
from fastapi import APIRouter, Depends, Body
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.db.models import Project, RiskScore, Alert
from app.services.ml.risk_engine import RiskEngine
from app.core.config import settings

router = APIRouter(prefix="/risk", tags=["Risk Engine"])


@router.get("/thresholds")
def get_current_thresholds():
    return {
        "cost_overrun_warn_pct": settings.COST_OVERRUN_WARN_PCT,
        "cost_overrun_crit_pct": settings.COST_OVERRUN_CRIT_PCT,
        "progress_gap_warn_pct": settings.PROGRESS_GAP_WARN_PCT,
        "progress_gap_crit_pct": settings.PROGRESS_GAP_CRIT_PCT,
        "delay_warn_days": settings.DELAY_WARN_DAYS,
        "delay_crit_days": settings.DELAY_CRIT_DAYS,
        "payment_spike_ratio": settings.PAYMENT_SPIKE_RATIO,
        "duplicate_proximity_km": settings.DUPLICATE_PROXIMITY_KM,
        "duplicate_similarity_threshold": settings.DUPLICATE_SIMILARITY_THRESHOLD,
        "isolation_forest_contamination": settings.ISOLATION_FOREST_CONTAMINATION
    }


@router.post("/recalculate")
def recalculate_all_risks(
    thresholds: Dict[str, Any] = Body(default={}),
    db: Session = Depends(get_db)
):
    # Optionally update in-memory settings
    if "cost_overrun_crit_pct" in thresholds:
        settings.COST_OVERRUN_CRIT_PCT = float(thresholds["cost_overrun_crit_pct"])
    if "progress_gap_crit_pct" in thresholds:
        settings.PROGRESS_GAP_CRIT_PCT = float(thresholds["progress_gap_crit_pct"])
    if "delay_crit_days" in thresholds:
        settings.DELAY_CRIT_DAYS = int(thresholds["delay_crit_days"])

    projects = db.query(Project).all()
    project_dicts = [
        {
            "project_id": p.project_id,
            "mp_id": p.mp_id,
            "state": p.state,
            "district": p.district,
            "constituency": p.constituency,
            "project_type": p.project_type,
            "description": p.description,
            "latitude": p.latitude,
            "longitude": p.longitude,
            "estimated_cost": p.estimated_cost,
            "sanctioned_amount": p.sanctioned_amount,
            "released_amount": p.released_amount,
            "expenditure": p.expenditure,
            "start_date": p.start_date.isoformat() if p.start_date else None,
            "expected_completion_date": p.expected_completion_date.isoformat() if p.expected_completion_date else None,
            "actual_completion_date": p.actual_completion_date.isoformat() if p.actual_completion_date else None,
            "physical_progress": p.physical_progress,
            "financial_progress": p.financial_progress,
            "implementing_agency": p.implementing_agency,
            "status": p.status,
            "synthetic_label": p.synthetic_label
        }
        for p in projects
    ]

    engine = RiskEngine()
    scored = engine.batch_score_projects(project_dicts)

    db.query(Alert).delete()
    for res in scored:
        p_id = res["project_id"]
        rs = db.query(RiskScore).filter(RiskScore.project_id == p_id).first()
        if not rs:
            rs = RiskScore(project_id=p_id)
            db.add(rs)

        rs.overall_score = res["overall_score"]
        rs.risk_level = res["risk_level"]
        rs.cost_risk = res["cost_risk"]
        rs.delay_risk = res["delay_risk"]
        rs.progress_gap_risk = res["progress_gap_risk"]
        rs.payment_risk = res["payment_risk"]
        rs.duplicate_risk = res["duplicate_risk"]
        rs.geo_risk = res["geo_risk"]
        rs.ml_risk = res["ml_risk"]
        rs.reasons_json = json.dumps(res["reasons"])

        for alert_data in res["alerts"]:
            alt = Alert(
                project_id=p_id,
                alert_type=alert_data["alert_type"],
                severity=alert_data["severity"],
                title=alert_data["title"],
                description=alert_data["description"],
                status="NEW"
            )
            db.add(alt)

    db.commit()

    return {
        "status": "SUCCESS",
        "message": f"Recalculated multi-factor risk scores and alerts for {len(projects)} projects.",
        "thresholds_applied": {
            "cost_overrun_crit_pct": settings.COST_OVERRUN_CRIT_PCT,
            "progress_gap_crit_pct": settings.PROGRESS_GAP_CRIT_PCT,
            "delay_crit_days": settings.DELAY_CRIT_DAYS
        }
    }
