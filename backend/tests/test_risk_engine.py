import pytest
from app.services.ml.risk_engine import RiskEngine


def test_transparent_risk_score_calculation():
    engine = RiskEngine()
    project = {
        "project_id": "P-RISK-01",
        "estimated_cost": 50.0,
        "sanctioned_amount": 50.0,
        "expenditure": 90.0,  # 80% overrun
        "physical_progress": 20.0,
        "financial_progress": 90.0,  # 70% progress gap
        "status": "IN_PROGRESS"
    }

    result = engine.calculate_project_risk(
        project_dict=project,
        isolation_anomaly_score=85.0,
        duplicate_score=75.0
    )

    assert result["overall_score"] >= 68.0
    assert result["risk_level"] in ["HIGH", "CRITICAL"]
    assert len(result["reasons"]) >= 2
    assert result["cost_risk"] > 0
    assert result["progress_gap_risk"] > 0
