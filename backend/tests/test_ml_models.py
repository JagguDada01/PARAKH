import pytest
from app.services.ml.isolation_forest import UnsupervisedAnomalyEngine
from app.services.ml.supervised_models import SupervisedModelBenchmarker


def test_isolation_forest_pipeline():
    engine = UnsupervisedAnomalyEngine(contamination=0.2)
    projects = [
        {
            "project_id": f"P-{i}",
            "estimated_cost": 25.0,
            "sanctioned_amount": 25.0,
            "expenditure": 25.0 if i < 15 else 80.0,
            "physical_progress": 80.0 if i < 15 else 10.0,
            "financial_progress": 80.0 if i < 15 else 95.0,
            "status": "IN_PROGRESS"
        }
        for i in range(20)
    ]

    scores, flags = engine.fit_predict(projects)
    assert len(scores) == 20
    assert len(flags) == 20
    # Anomalous projects (i >= 15) should have higher anomaly scores
    assert scores[18] > scores[2]


def test_supervised_benchmarker():
    benchmarker = SupervisedModelBenchmarker()
    projects = [
        {
            "project_id": f"P-{i}",
            "estimated_cost": 30.0,
            "sanctioned_amount": 30.0,
            "expenditure": 30.0 if i % 2 == 0 else 75.0,
            "physical_progress": 70.0 if i % 2 == 0 else 15.0,
            "financial_progress": 70.0 if i % 2 == 0 else 90.0,
            "status": "IN_PROGRESS",
            "synthetic_label": 0 if i % 2 == 0 else 1
        }
        for i in range(24)
    ]

    res = benchmarker.train_and_evaluate_all(projects)
    assert len(res["models"]) == 4
    model_names = [m["model_name"] for m in res["models"]]
    assert "Logistic Regression" in model_names
    assert "Random Forest" in model_names
    assert "XGBoost" in model_names
    assert "LightGBM" in model_names
    assert res["best_model_name"] in model_names
