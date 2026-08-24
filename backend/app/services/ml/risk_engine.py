import json
from typing import List, Dict, Any, Tuple
from sqlalchemy.orm import Session
from app.services.ml.rule_engine import RuleBasedAnomalyEngine
from app.services.ml.isolation_forest import UnsupervisedAnomalyEngine
from app.services.ml.duplicate_detector import DuplicateProjectDetector


class RiskEngine:
    """
    Transparent, explainable risk scoring engine that computes multi-factor
    risk scores (0 to 100) and risk levels (LOW, MEDIUM, HIGH, CRITICAL).
    """

    def __init__(self, rule_engine: RuleBasedAnomalyEngine = None):
        self.rule_engine = rule_engine or RuleBasedAnomalyEngine()
        self.isolation_engine = UnsupervisedAnomalyEngine()
        self.duplicate_detector = DuplicateProjectDetector()

    def calculate_project_risk(
        self,
        project_dict: Dict[str, Any],
        isolation_anomaly_score: float = 0.0,
        duplicate_score: float = 0.0,
        all_projects: List[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Calculate transparent component risk scores and overall risk level for a project.
        """
        # Run rule engine
        rule_eval = self.rule_engine.evaluate_project(project_dict, all_projects)

        cost_risk = float(rule_eval["cost_risk_score"])
        delay_risk = float(rule_eval["delay_risk_score"])
        progress_gap_risk = float(rule_eval["progress_gap_risk_score"])
        payment_risk = float(rule_eval["payment_risk_score"])
        geo_risk = float(rule_eval["geo_risk_score"])
        dup_risk = float(duplicate_score)
        ml_risk = float(isolation_anomaly_score)

        # Weighted composite score
        # 25% Cost, 20% Delay, 20% Progress Gap, 15% Payment, 10% Duplicate, 5% Geo, 5% ML
        overall_score = (
            0.25 * cost_risk +
            0.20 * delay_risk +
            0.20 * progress_gap_risk +
            0.15 * payment_risk +
            0.10 * dup_risk +
            0.05 * geo_risk +
            0.05 * ml_risk
        )

        # Ensure max component impact: if any primary risk is extreme (>90), overall should be at least 65
        if max(cost_risk, delay_risk, progress_gap_risk, payment_risk) >= 90.0:
            overall_score = max(overall_score, 68.0)

        # If duplicate score is high, add reason
        reasons = list(rule_eval["reasons"])
        if dup_risk >= 65.0:
            reasons.append(f"Potential duplicate project flagged (similarity index: {dup_risk:.1f}/100)")
        if ml_risk >= 75.0:
            reasons.append(f"Unsupervised Isolation Forest flagged anomalous multivariate pattern ({ml_risk:.1f}/100)")

        # Map to Risk Level
        if overall_score >= 81.0:
            risk_level = "CRITICAL"
        elif overall_score >= 61.0:
            risk_level = "HIGH"
        elif overall_score >= 31.0:
            risk_level = "MEDIUM"
        else:
            risk_level = "LOW"

        return {
            "overall_score": round(min(100.0, max(0.0, overall_score)), 1),
            "risk_level": risk_level,
            "cost_risk": round(cost_risk, 1),
            "delay_risk": round(delay_risk, 1),
            "progress_gap_risk": round(progress_gap_risk, 1),
            "payment_risk": round(payment_risk, 1),
            "duplicate_risk": round(dup_risk, 1),
            "geo_risk": round(geo_risk, 1),
            "ml_risk": round(ml_risk, 1),
            "reasons": reasons,
            "alerts": rule_eval["alerts"],
            "cost_escalation_pct": rule_eval["cost_escalation_pct"],
            "progress_gap_pct": rule_eval["progress_gap_pct"],
            "delay_days": rule_eval["delay_days"]
        }

    def batch_score_projects(self, projects: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Runs batch scoring for a collection of projects including duplicate detection
        and isolation forest inference.
        """
        if not projects:
            return []

        # 1. Run Isolation Forest across all projects
        try:
            iso_scores, _ = self.isolation_engine.fit_predict(projects)
        except Exception:
            iso_scores = [0.0] * len(projects)

        # 2. Run Duplicate detection
        dup_map = {}
        try:
            dup_candidates = self.duplicate_detector.find_potential_duplicates(projects)
            for cand in dup_candidates:
                a_id = cand["project_a_id"]
                b_id = cand["project_b_id"]
                score = cand["duplicate_score"]
                dup_map[a_id] = max(dup_map.get(a_id, 0.0), score)
                dup_map[b_id] = max(dup_map.get(b_id, 0.0), score)
        except Exception:
            dup_candidates = []

        # 3. Score each project
        scored = []
        for idx, p in enumerate(projects):
            p_id = p.get("project_id")
            iso_score = iso_scores[idx] if idx < len(iso_scores) else 0.0
            dup_score = dup_map.get(p_id, 0.0)

            result = self.calculate_project_risk(
                project_dict=p,
                isolation_anomaly_score=iso_score,
                duplicate_score=dup_score,
                all_projects=projects
            )
            scored.append({
                "project_id": p_id,
                **result
            })

        return scored


def compute_and_save_all_risk_scores(db: Session) -> int:
    """
    Helper to recalculate and persist all risk scores & alerts across all projects in the database.
    """
    from app.db.models import Project, RiskScore, Alert

    projects = db.query(Project).all()
    if not projects:
        return 0

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
            "start_date": str(p.start_date) if p.start_date else None,
            "expected_completion_date": str(p.expected_completion_date) if p.expected_completion_date else None,
            "actual_completion_date": str(p.actual_completion_date) if p.actual_completion_date else None,
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
    db.query(RiskScore).delete()
    
    risk_objects = []
    alert_objects = []

    for res in scored:
        p_id = res["project_id"]
        risk_objects.append(RiskScore(
            project_id=p_id,
            overall_score=res["overall_score"],
            risk_level=res["risk_level"],
            cost_risk=res["cost_risk"],
            delay_risk=res["delay_risk"],
            progress_gap_risk=res["progress_gap_risk"],
            payment_risk=res["payment_risk"],
            duplicate_risk=res["duplicate_risk"],
            geo_risk=res["geo_risk"],
            ml_risk=res["ml_risk"],
            reasons_json=json.dumps(res["reasons"])
        ))

        for alert_data in res["alerts"]:
            alert_objects.append(Alert(
                project_id=p_id,
                alert_type=alert_data["alert_type"],
                severity=alert_data["severity"],
                title=alert_data["title"],
                description=alert_data["description"],
                status="NEW"
            ))

    db.bulk_save_objects(risk_objects)
    db.bulk_save_objects(alert_objects)
    db.commit()
    return len(projects)


