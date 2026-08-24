from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.db.models import DuplicateCandidate, Project, AuditLog, User
from app.core.auth import get_current_user
from app.schemas.project import DuplicateCandidateOut

router = APIRouter(prefix="/duplicates", tags=["Duplicate Detection"])


@router.get("", response_model=List[DuplicateCandidateOut])
def list_duplicates(
    status_filter: Optional[str] = Query(None),
    min_score: Optional[float] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(DuplicateCandidate)

    if status_filter:
        query = query.filter(DuplicateCandidate.status == status_filter.upper())
    if min_score:
        query = query.filter(DuplicateCandidate.duplicate_score >= min_score)

    candidates = query.order_by(DuplicateCandidate.duplicate_score.desc()).all()

    results = []
    for d in candidates:
        p_b = db.query(Project).filter(Project.project_id == d.project_b_id).first()
        results.append(
            DuplicateCandidateOut(
                id=d.id,
                project_a_id=d.project_a_id,
                project_b_id=d.project_b_id,
                semantic_similarity=d.semantic_similarity,
                distance_km=d.distance_km,
                duplicate_score=d.duplicate_score,
                status=d.status,
                notes=d.notes,
                created_at=d.created_at,
                other_project_title=p_b.description if p_b else d.project_b_id,
                other_project_state=p_b.state if p_b else "",
                other_project_district=p_b.district if p_b else ""
            )
        )
    return results


@router.patch("/{candidate_id}/status")
def update_duplicate_status(
    candidate_id: int,
    status_val: str = Query(..., regex="^(FLAGGED|CONFIRMED_DISTINCT|CONFIRMED_DUPLICATE|UNDER_REVIEW)$"),
    notes: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user)
):
    cand = db.query(DuplicateCandidate).filter(DuplicateCandidate.id == candidate_id).first()
    if not cand:
        raise HTTPException(status_code=404, detail="Duplicate candidate record not found.")

    cand.status = status_val.upper()
    if notes:
        cand.notes = notes

    # Audit log
    db.add(AuditLog(
        user_id=current_user.id if current_user else None,
        user_email=current_user.email if current_user else "system@mplads.gov.in",
        action="DUPLICATE_TRIAGE",
        target_type="DUPLICATE_CANDIDATE",
        target_id=str(cand.id),
        details=f"Status changed to {cand.status}. Notes: {notes or 'None'}"
    ))
    db.commit()

    return {"message": f"Duplicate candidate marked as '{cand.status}'."}
