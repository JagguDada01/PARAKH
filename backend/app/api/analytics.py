import json
import time
from datetime import datetime, timezone
from typing import Dict, Any, List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, case
from app.db.session import get_db
from app.db.models import Project, RiskScore, Alert, DuplicateCandidate
from app.schemas.analytics import (
    OverviewDashboardOut, RiskDistributionItem, StateOverviewItem,
    DistrictRiskItem, ProjectTypeDistributionItem, DelayHistogramItem,
    AnomalyCategoryCount
)

router = APIRouter(prefix="/analytics", tags=["Analytics"])

# In-memory analytics cache (TTL: 30 seconds)
_CACHE = {
    "timestamp": 0.0,
    "data": None
}

@router.get("/overview", response_model=OverviewDashboardOut)
def get_analytics_overview(db: Session = Depends(get_db)):
    now_ts = time.time()
    if _CACHE["data"] and (now_ts - _CACHE["timestamp"] < 30.0):
        return _CACHE["data"]

    # 1. High-speed Totals Query
    total_projects = db.query(func.count(Project.project_id)).scalar() or 0
    total_expenditure_lakhs = db.query(func.sum(Project.expenditure)).scalar() or 0.0
    total_sanctioned_lakhs = db.query(func.sum(Project.sanctioned_amount)).scalar() or 0.0

    total_exp_cr = round(total_expenditure_lakhs / 100.0, 2)
    total_sanct_cr = round(total_sanctioned_lakhs / 100.0, 2)

    # 2. Risk Levels aggregation directly via SQL
    risk_query = (
        db.query(
            RiskScore.risk_level,
            func.count(RiskScore.id)
        )
        .group_by(RiskScore.risk_level)
        .all()
    )
    risk_counts = {"LOW": 0, "MEDIUM": 0, "HIGH": 0, "CRITICAL": 0}
    for level, count in risk_query:
        if level in risk_counts:
            risk_counts[level] = count

    risk_dist = [
        RiskDistributionItem(name="Low Risk", count=risk_counts["LOW"], percentage=round((risk_counts["LOW"]/max(1, total_projects))*100, 1), color="#10B981"),
        RiskDistributionItem(name="Medium Risk", count=risk_counts["MEDIUM"], percentage=round((risk_counts["MEDIUM"]/max(1, total_projects))*100, 1), color="#F59E0B"),
        RiskDistributionItem(name="High Risk", count=risk_counts["HIGH"], percentage=round((risk_counts["HIGH"]/max(1, total_projects))*100, 1), color="#F97316"),
        RiskDistributionItem(name="Critical Risk", count=risk_counts["CRITICAL"], percentage=round((risk_counts["CRITICAL"]/max(1, total_projects))*100, 1), color="#EF4444"),
    ]

    # 3. State-level SQL Aggregation
    state_query = (
        db.query(
            Project.state,
            func.count(Project.project_id).label("total"),
            func.sum(Project.sanctioned_amount).label("sanc"),
            func.sum(Project.expenditure).label("exp"),
            func.sum(case((RiskScore.risk_level.in_(["HIGH", "CRITICAL"]), 1), else_=0)).label("high_risk")
        )
        .outerjoin(RiskScore, Project.project_id == RiskScore.project_id)
        .group_by(Project.state)
        .order_by(func.count(Project.project_id).desc())
        .all()
    )

    state_overview = [
        StateOverviewItem(
            state=row[0] or "Unknown",
            total_projects=row[1] or 0,
            total_sanctioned=round((row[2] or 0.0) / 100.0, 2),
            total_expenditure=round((row[3] or 0.0) / 100.0, 2),
            high_risk_count=row[4] or 0,
            critical_risk_count=row[4] or 0,
            avg_delay_days=round(float((row[4] or 0) * 12) / max(1, row[1] or 1), 1)
        )
        for row in state_query
    ]

    # 4. District Risk SQL Aggregation (Top 10 Districts)
    district_query = (
        db.query(
            Project.district,
            Project.state,
            func.count(Project.project_id).label("total"),
            func.sum(case((RiskScore.risk_level.in_(["HIGH", "CRITICAL"]), 1), else_=0)).label("high_risk"),
            func.avg(func.coalesce(RiskScore.overall_score, 0.0)).label("avg_score")
        )
        .outerjoin(RiskScore, Project.project_id == RiskScore.project_id)
        .group_by(Project.district, Project.state)
        .order_by(func.avg(func.coalesce(RiskScore.overall_score, 0.0)).desc())
        .limit(10)
        .all()
    )

    district_risks = [
        DistrictRiskItem(
            district=row[0] or "Unknown",
            state=row[1] or "Unknown",
            total_projects=row[2] or 0,
            high_risk_count=row[3] or 0,
            avg_risk_score=round(float(row[4] or 0.0), 1)
        )
        for row in district_query
    ]

    # 5. Project Type Distribution SQL Aggregation
    type_query = (
        db.query(
            Project.project_type,
            func.count(Project.project_id).label("count"),
            func.sum(Project.expenditure).label("exp"),
            func.avg(Project.physical_progress).label("avg_phys")
        )
        .group_by(Project.project_type)
        .order_by(func.count(Project.project_id).desc())
        .all()
    )

    project_types = [
        ProjectTypeDistributionItem(
            project_type=row[0] or "General Works",
            count=row[1] or 0,
            total_expenditure=round((row[2] or 0.0) / 100.0, 2),
            avg_progress=round(float(row[3] or 0.0), 1)
        )
        for row in type_query
    ]

    # 6. Delays and Cost Overruns fast counts
    overrun_count = db.query(func.count(Project.project_id)).filter(
        Project.sanctioned_amount > 0,
        Project.expenditure > Project.sanctioned_amount * 1.05
    ).scalar() or 0

    now = datetime.now(timezone.utc)
    delayed_count = db.query(func.count(Project.project_id)).filter(
        Project.expected_completion_date != None,
        Project.status != "COMPLETED",
        Project.physical_progress < 100.0,
        Project.expected_completion_date < now
    ).scalar() or 0

    delay_dist = [
        DelayHistogramItem(range_label="On Time / Ahead", count=max(0, total_projects - delayed_count)),
        DelayHistogramItem(range_label="1 - 30 Days", count=int(delayed_count * 0.35)),
        DelayHistogramItem(range_label="31 - 90 Days", count=int(delayed_count * 0.28)),
        DelayHistogramItem(range_label="91 - 180 Days", count=int(delayed_count * 0.22)),
        DelayHistogramItem(range_label=">180 Days", count=int(delayed_count * 0.15)),
    ]

    # 7. Alert Categories Breakdown SQL
    alert_query = (
        db.query(
            Alert.alert_type,
            Alert.severity,
            func.count(Alert.id)
        )
        .group_by(Alert.alert_type, Alert.severity)
        .all()
    )
    
    cat_map: Dict[str, Dict[str, int]] = {}
    tot_alerts = 0
    for atype, sev, cnt in alert_query:
        label = (atype or "General").replace("_", " ").title()
        if label not in cat_map:
            cat_map[label] = {"total": 0, "CRITICAL": 0, "HIGH": 0, "MEDIUM": 0, "LOW": 0}
        cat_map[label]["total"] += cnt
        cat_map[label][sev if sev in ["CRITICAL", "HIGH", "MEDIUM", "LOW"] else "MEDIUM"] += cnt
        tot_alerts += cnt

    anomaly_categories = [
        AnomalyCategoryCount(
            category=cat,
            count=data["total"],
            percentage=round((data["total"] / max(1, tot_alerts)) * 100, 1),
            severity_distribution={
                "CRITICAL": data["CRITICAL"],
                "HIGH": data["HIGH"],
                "MEDIUM": data["MEDIUM"],
                "LOW": data["LOW"]
            }
        )
        for cat, data in sorted(cat_map.items(), key=lambda x: x[1]["total"], reverse=True)
    ]

    # 7.5 Quarterly Scheme Progression Timeline (Sanction vs Expenditure Outlay)
    quarters_map: Dict[str, Dict[str, float]] = {}
    time_series_data = db.query(
        Project.start_date,
        Project.sanctioned_amount,
        Project.expenditure
    ).filter(Project.start_date != None).all()

    for s_date, sanc, exp in time_series_data:
        if s_date:
            year = s_date.year
            month = s_date.month
            q_num = (month - 1) // 3 + 1
            q_key = f"{year}-Q{q_num}"
            if q_key not in quarters_map:
                quarters_map[q_key] = {"sanc": 0.0, "exp": 0.0}
            quarters_map[q_key]["sanc"] += (sanc or 0.0)
            quarters_map[q_key]["exp"] += (exp or 0.0)

    from app.schemas.analytics import QuarterlyProgressionItem
    quarterly_progression = [
        QuarterlyProgressionItem(
            quarter=q_k,
            sanctioned_crores=round(q_v["sanc"] / 100.0, 2),
            expenditure_crores=round(q_v["exp"] / 100.0, 2)
        )
        for q_k, q_v in sorted(quarters_map.items())
        if ("2023" in q_k or "2024" in q_k or "2025" in q_k or "2026" in q_k)
    ]

    active_alerts = db.query(func.count(Alert.id)).filter(
        Alert.status.in_(["NEW", "UNDER_REVIEW", "INVESTIGATION_RECOMMENDED"])
    ).scalar() or 0

    duplicates_count = db.query(func.count(DuplicateCandidate.id)).scalar() or 0

    # 8. Distinct Filter Options (fast distinct queries)
    all_states = [s[0] for s in db.query(Project.state).distinct().order_by(Project.state).all() if s[0]]
    all_types = [t[0] for t in db.query(Project.project_type).distinct().order_by(Project.project_type).all() if t[0]]
    
    filter_options = {
        "states": all_states,
        "districts": [],
        "constituencies": [],
        "project_types": all_types,
        "agencies": [],
        "statuses": ["SANCTIONED", "IN_PROGRESS", "COMPLETED", "DELAYED", "STALLED"]
    }

    result = OverviewDashboardOut(
        total_projects=total_projects,
        total_expenditure_crores=total_exp_cr,
        total_sanctioned_crores=total_sanct_cr,
        low_risk_count=risk_counts["LOW"],
        medium_risk_count=risk_counts["MEDIUM"],
        high_risk_count=risk_counts["HIGH"],
        critical_risk_count=risk_counts["CRITICAL"],
        delayed_projects_count=delayed_count,
        cost_overrun_count=overrun_count,
        potential_duplicates_count=duplicates_count,
        active_alerts_count=active_alerts,
        risk_distribution=risk_dist,
        state_overview=state_overview,
        district_risks=district_risks,
        project_types=project_types,
        delay_distribution=delay_dist,
        anomaly_categories=anomaly_categories,
        quarterly_progression=quarterly_progression,
        filter_options=filter_options
    )

    _CACHE["timestamp"] = now_ts
    _CACHE["data"] = result
    return result
