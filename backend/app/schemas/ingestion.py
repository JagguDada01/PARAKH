from typing import Optional, List, Dict, Any
from pydantic import BaseModel


class ValidationErrorItem(BaseModel):
    row_number: int
    field_name: str
    rejected_value: Any
    reason: str


class IngestionSummaryOut(BaseModel):
    total_records: int
    valid_records: int
    invalid_records: int
    duplicate_records: int
    missing_fields_count: int
    data_quality_score: float  # 0 to 100%
    normalized_states_count: int
    normalized_currencies_count: int
    validation_errors: List[ValidationErrorItem] = []
    message: str
