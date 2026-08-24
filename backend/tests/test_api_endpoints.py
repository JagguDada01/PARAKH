import pytest
from fastapi.testclient import TestClient
from app.main import app


@pytest.fixture(scope="module")
def client():
    with TestClient(app) as c:
        yield c


def test_health_check(client):
    res = client.get("/health")
    assert res.status_code == 200
    assert res.json()["status"] == "HEALTHY"


def test_demo_login_and_auth(client):
    res = client.post("/api/v1/auth/demo-login/investigator")
    assert res.status_code == 200
    data = res.json()
    assert "access_token" in data
    assert data["role"] == "INVESTIGATOR"


def test_analytics_overview(client):
    res = client.get("/api/v1/analytics/overview")
    assert res.status_code == 200
    data = res.json()
    assert data["total_projects"] > 0
    assert len(data["risk_distribution"]) == 4
    assert len(data["state_overview"]) > 0


def test_projects_list_and_filter(client):
    res = client.get("/api/v1/projects?limit=10")
    assert res.status_code == 200
    projects = res.json()
    assert len(projects) > 0
    first_pid = projects[0]["project_id"]

    # Detail view
    detail_res = client.get(f"/api/v1/projects/{first_pid}")
    assert detail_res.status_code == 200
    detail = detail_res.json()
    assert detail["project_id"] == first_pid
    assert "ai_explanation" in detail
    assert "financial_records" in detail


def test_ai_assistant_query(client):
    payload = {"query": "Show high-risk projects in Manipur"}
    res = client.post("/api/v1/ai/query", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert "answer_markdown" in data
    assert len(data["answer_markdown"]) > 10


def test_ml_benchmarks(client):
    res = client.get("/api/v1/ml/models")
    assert res.status_code == 200
    data = res.json()
    assert len(data["models"]) >= 4
    assert "best_model_name" in data
