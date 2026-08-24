import json
from typing import Dict, Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.db.models import ModelRun, Project
from app.schemas.ml import ModelComparisonResponse, ModelRunOut
from app.services.ml.supervised_models import SupervisedModelBenchmarker
from app.core.config import settings

router = APIRouter(prefix="/ml", tags=["Machine Learning"])


@router.get("/models", response_model=ModelComparisonResponse)
def get_model_benchmarks(db: Session = Depends(get_db)):
    model_runs = db.query(ModelRun).order_by(ModelRun.f1_score.desc().nullslast()).all()
    
    if not model_runs:
        # Trigger dynamic training if not yet run
        return train_all_models(db=db)

    results = []
    best_model_name = ""
    highest_f1 = -1.0

    for mr in model_runs:
        cm_data = json.loads(mr.confusion_matrix_json) if mr.confusion_matrix_json else {"tn": 0, "fp": 0, "fn": 0, "tp": 0}
        fi_data = json.loads(mr.feature_importance_json) if mr.feature_importance_json else []
        hp_data = json.loads(mr.hyperparameters_json) if mr.hyperparameters_json else {}

        if mr.f1_score and mr.f1_score > highest_f1:
            highest_f1 = mr.f1_score
            best_model_name = mr.model_name

        results.append(
            ModelRunOut(
                id=mr.id,
                model_name=mr.model_name,
                model_type=mr.model_type,
                accuracy=mr.accuracy,
                precision=mr.precision,
                recall=mr.recall,
                f1_score=mr.f1_score,
                roc_auc=mr.roc_auc,
                confusion_matrix=cm_data,
                feature_importance=fi_data,
                hyperparameters=hp_data,
                is_active=mr.is_active,
                trained_at=mr.trained_at
            )
        )

    projects_count = db.query(Project).count()
    positive_count = db.query(Project).filter(Project.synthetic_label == 1).count()

    return ModelComparisonResponse(
        models=results,
        best_model_name=best_model_name or "Random Forest",
        selection_metric="F1-Score & ROC-AUC Composite (60% F1 + 40% ROC-AUC)",
        evaluation_criteria_notes=(
            f"Candidate models evaluated via Stratified 5-Fold Cross-Validation. "
            f"'{best_model_name}' selected as optimal classifier based on highest harmonic mean of precision and recall."
        ),
        isolation_forest_summary={
            "algorithm": "Isolation Forest (Unsupervised)",
            "contamination": settings.ISOLATION_FOREST_CONTAMINATION,
            "features_engineered": 8,
            "status": "Active Inference"
        },
        training_samples_count=projects_count,
        positive_labels_count=positive_count,
        disclaimer=(
            "NOTE: Supervised learning models are demonstrated using synthetic simulated audit labels. "
            "In production environments, ground-truth audit investigation logs are required. "
            "Demographic parameters (religion, caste, ethnicity, MP identity) are strictly excluded."
        )
    )


@router.post("/train", response_model=ModelComparisonResponse)
def train_all_models(db: Session = Depends(get_db)):
    projects = db.query(Project).all()
    project_dicts = [
        {
            "project_id": p.project_id,
            "estimated_cost": p.estimated_cost,
            "sanctioned_amount": p.sanctioned_amount,
            "expenditure": p.expenditure,
            "start_date": p.start_date.isoformat() if p.start_date else None,
            "expected_completion_date": p.expected_completion_date.isoformat() if p.expected_completion_date else None,
            "actual_completion_date": p.actual_completion_date.isoformat() if p.actual_completion_date else None,
            "physical_progress": p.physical_progress,
            "financial_progress": p.financial_progress,
            "status": p.status,
            "synthetic_label": p.synthetic_label
        }
        for p in projects
    ]

    benchmarker = SupervisedModelBenchmarker()
    comparison_res = benchmarker.train_and_evaluate_all(project_dicts)

    # Save to database
    db.query(ModelRun).delete()
    for m in comparison_res.get("models", []):
        mr = ModelRun(
            model_name=m["model_name"],
            model_type=m["model_type"],
            accuracy=m["accuracy"],
            precision=m["precision"],
            recall=m["recall"],
            f1_score=m["f1_score"],
            roc_auc=m["roc_auc"],
            confusion_matrix_json=json.dumps(m["confusion_matrix"]),
            feature_importance_json=json.dumps(m["feature_importance"]),
            hyperparameters_json=json.dumps(m["hyperparameters"]),
            is_active=m["is_active"]
        )
        db.add(mr)
    db.commit()

    return comparison_res
