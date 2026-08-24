from typing import Optional, List, Dict, Any
from pydantic import BaseModel
from datetime import datetime


class ConfusionMatrixData(BaseModel):
    tn: int
    fp: int
    fn: int
    tp: int


class FeatureImportanceItem(BaseModel):
    feature: str
    importance: float


class ModelRunOut(BaseModel):
    id: int
    model_name: str
    model_type: str
    accuracy: Optional[float] = None
    precision: Optional[float] = None
    recall: Optional[float] = None
    f1_score: Optional[float] = None
    roc_auc: Optional[float] = None
    confusion_matrix: Optional[ConfusionMatrixData] = None
    feature_importance: List[FeatureImportanceItem] = []
    hyperparameters: Dict[str, Any] = {}
    is_active: bool = False
    trained_at: datetime

    class Config:
        from_attributes = True


class ModelComparisonResponse(BaseModel):
    models: List[ModelRunOut]
    best_model_name: str
    selection_metric: str
    evaluation_criteria_notes: str
    isolation_forest_summary: Dict[str, Any]
    training_samples_count: int
    positive_labels_count: int
    disclaimer: str
