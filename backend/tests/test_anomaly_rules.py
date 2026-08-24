import pytest
from app.services.ml.rule_engine import RuleBasedAnomalyEngine


def test_cost_escalation_rule():
    engine = RuleBasedAnomalyEngine()
    project = {
        "project_id": "P-TEST-01",
        "estimated_cost": 50.0,
        "sanctioned_amount": 50.0,
        "expenditure": 85.0,  # 70% escalation
        "physical_progress": 50.0,
        "financial_progress": 100.0,
    }
    result = engine.evaluate_project(project)
    assert result["cost_risk_score"] >= 90.0
    assert result["cost_escalation_pct"] == 70.0
    assert any("cost escalation" in r for r in result["reasons"])


def test_progress_gap_rule():
    engine = RuleBasedAnomalyEngine()
    project = {
        "project_id": "P-TEST-02",
        "estimated_cost": 40.0,
        "sanctioned_amount": 40.0,
        "expenditure": 36.0,
        "physical_progress": 15.0,
        "financial_progress": 90.0,  # 75% gap
    }
    result = engine.evaluate_project(project)
    assert result["progress_gap_risk_score"] >= 90.0
    assert result["progress_gap_pct"] == 75.0
    assert any("progress mismatch" in r for r in result["reasons"])
