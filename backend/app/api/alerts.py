from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.db.models import Alert, Project, RiskScore, AuditLog, User
from app.core.auth import get_current_user
from app.schemas.alert import AlertDetailOut, AlertStatusUpdate

router = APIRouter(prefix="/alerts", tags=["Investigation & Alerts"])


@router.get("", response_model=List[AlertDetailOut])
def list_alerts(
    status_filter: Optional[str] = Query(None),
    severity: Optional[str] = Query(None),
    alert_type: Optional[str] = Query(None),
    limit: int = Query(100, le=1000),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    query = db.query(Alert).join(Project).outerjoin(RiskScore)

    if status_filter:
        query = query.filter(Alert.status == status_filter.upper())
    if severity:
        query = query.filter(Alert.severity == severity.upper())
    if alert_type:
        query = query.filter(Alert.alert_type == alert_type.upper())

    alerts = query.order_by(Alert.created_at.desc()).offset(offset).limit(limit).all()


    results = []
    for a in alerts:
        p = a.project
        r = p.risk_score if p else None
        results.append(
            AlertDetailOut(
                id=a.id,
                project_id=a.project_id,
                project_title=p.description if p else "",
                state=p.state if p else "",
                district=p.district if p else "",
                project_type=p.project_type if p else "",
                alert_type=a.alert_type,
                severity=a.severity,
                title=a.title,
                description=a.description,
                status=a.status,
                assigned_to=a.assigned_to,
                resolution_notes=a.resolution_notes,
                created_at=a.created_at,
                updated_at=a.updated_at,
                risk_score=r.overall_score if r else 0.0
            )
        )
    return results


@router.patch("/{alert_id}/status")
def update_alert_status(
    alert_id: int,
    payload: AlertStatusUpdate,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user)
):
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found.")

    valid_statuses = ["NEW", "UNDER_REVIEW", "INVESTIGATION_RECOMMENDED", "RESOLVED", "DISMISSED"]
    if payload.status.upper() not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {valid_statuses}")

    old_status = alert.status
    alert.status = payload.status.upper()
    if payload.resolution_notes:
        alert.resolution_notes = payload.resolution_notes
    if payload.assigned_to:
        alert.assigned_to = payload.assigned_to
    elif current_user and not alert.assigned_to:
        alert.assigned_to = current_user.full_name

    alert.updated_at = datetime.now(timezone.utc)

    # Log to Audit Trail
    audit = AuditLog(
        user_id=current_user.id if current_user else None,
        user_email=current_user.email if current_user else "system@mplads.gov.in",
        action="ALERT_STATUS_UPDATE",
        target_type="ALERT",
        target_id=str(alert.id),
        details=f"Status changed from {old_status} to {alert.status}. Notes: {payload.resolution_notes or 'None'}"
    )
    db.add(audit)
    db.commit()
    db.refresh(alert)

    return {
        "id": alert.id,
        "status": alert.status,
        "assigned_to": alert.assigned_to,
        "resolution_notes": alert.resolution_notes,
        "updated_at": alert.updated_at,
        "message": f"Alert status successfully updated to '{alert.status}'."
    }
