from datetime import datetime, timezone
from sqlalchemy import (
    Column, Integer, String, Float, Boolean, DateTime, Text, ForeignKey, Enum as SQLEnum
)
from sqlalchemy.orm import relationship
from app.db.session import Base
import enum


class UserRole(str, enum.Enum):
    ADMIN = "ADMIN"
    ANALYST = "ANALYST"
    INVESTIGATOR = "INVESTIGATOR"
    VIEWER = "VIEWER"


class RiskLevelEnum(str, enum.Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class AlertStatusEnum(str, enum.Enum):
    NEW = "NEW"
    UNDER_REVIEW = "UNDER_REVIEW"
    INVESTIGATION_RECOMMENDED = "INVESTIGATION_RECOMMENDED"
    RESOLVED = "RESOLVED"
    DISMISSED = "DISMISSED"


class DuplicateStatusEnum(str, enum.Enum):
    FLAGGED = "FLAGGED"
    CONFIRMED_DISTINCT = "CONFIRMED_DISTINCT"
    CONFIRMED_DUPLICATE = "CONFIRMED_DUPLICATE"
    UNDER_REVIEW = "UNDER_REVIEW"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    role = Column(String(50), default=UserRole.VIEWER.value, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class Project(Base):
    __tablename__ = "projects"

    project_id = Column(String(100), primary_key=True, index=True)
    mp_id = Column(String(100), index=True, nullable=False)
    state = Column(String(100), index=True, nullable=False)
    district = Column(String(100), index=True, nullable=False)
    constituency = Column(String(100), index=True, nullable=False)
    project_type = Column(String(100), index=True, nullable=False)
    description = Column(Text, nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    
    # Financial fields (Amounts in INR Lakhs)
    estimated_cost = Column(Float, nullable=False)
    sanctioned_amount = Column(Float, nullable=False)
    released_amount = Column(Float, nullable=False)
    expenditure = Column(Float, nullable=False)
    
    # Timeline
    start_date = Column(DateTime, nullable=False)
    expected_completion_date = Column(DateTime, nullable=False)
    actual_completion_date = Column(DateTime, nullable=True)
    
    # Progress metrics (0 - 100%)
    physical_progress = Column(Float, default=0.0, nullable=False)
    financial_progress = Column(Float, default=0.0, nullable=False)
    
    implementing_agency = Column(String(255), index=True, nullable=False)
    status = Column(String(50), index=True, default="IN_PROGRESS", nullable=False)
    
    # Ground truth synthetic demo label (0 = Normal, 1 = Irregularity/Anomaly)
    synthetic_label = Column(Integer, default=0, nullable=False)
    
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    financial_records = relationship("FinancialRecord", back_populates="project", cascade="all, delete-orphan")
    progress_records = relationship("ProgressRecord", back_populates="project", cascade="all, delete-orphan")
    risk_score = relationship("RiskScore", back_populates="project", uselist=False, cascade="all, delete-orphan")
    alerts = relationship("Alert", back_populates="project", cascade="all, delete-orphan")


class FinancialRecord(Base):
    __tablename__ = "financial_records"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(String(100), ForeignKey("projects.project_id", ondelete="CASCADE"), nullable=False, index=True)
    transaction_type = Column(String(50), nullable=False)  # SANCTION, RELEASE, EXPENDITURE, CONTRACTOR_PAYMENT
    amount = Column(Float, nullable=False)  # in Lakhs
    date = Column(DateTime, nullable=False)
    description = Column(Text, nullable=True)
    payee = Column(String(255), nullable=True)
    reference_number = Column(String(100), nullable=True)

    project = relationship("Project", back_populates="financial_records")


class ProgressRecord(Base):
    __tablename__ = "progress_records"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(String(100), ForeignKey("projects.project_id", ondelete="CASCADE"), nullable=False, index=True)
    inspection_date = Column(DateTime, nullable=False)
    physical_percentage = Column(Float, nullable=False)
    financial_percentage = Column(Float, nullable=False)
    remarks = Column(Text, nullable=True)
    inspector_name = Column(String(255), nullable=True)
    photos_count = Column(Integer, default=0)

    project = relationship("Project", back_populates="progress_records")


class Agency(Base):
    __tablename__ = "agencies"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), unique=True, index=True, nullable=False)
    state = Column(String(100), nullable=False)
    district = Column(String(100), nullable=False)
    performance_score = Column(Float, default=85.0)
    total_projects = Column(Integer, default=0)
    delayed_projects = Column(Integer, default=0)


class RiskScore(Base):
    __tablename__ = "risk_scores"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(String(100), ForeignKey("projects.project_id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    overall_score = Column(Float, nullable=False, default=0.0)  # 0 to 100
    risk_level = Column(String(20), nullable=False, default="LOW")  # LOW, MEDIUM, HIGH, CRITICAL
    
    # Sub-component scores (0 to 100 each)
    cost_risk = Column(Float, default=0.0)
    delay_risk = Column(Float, default=0.0)
    progress_gap_risk = Column(Float, default=0.0)
    payment_risk = Column(Float, default=0.0)
    duplicate_risk = Column(Float, default=0.0)
    geo_risk = Column(Float, default=0.0)
    ml_risk = Column(Float, default=0.0)
    
    reasons_json = Column(Text, default="[]")  # JSON encoded list of explainability reasons
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    project = relationship("Project", back_populates="risk_score")


class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(String(100), ForeignKey("projects.project_id", ondelete="CASCADE"), nullable=False, index=True)
    alert_type = Column(String(50), nullable=False, index=True)
    severity = Column(String(20), nullable=False, default="MEDIUM")
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    status = Column(String(50), default=AlertStatusEnum.NEW.value, nullable=False, index=True)
    assigned_to = Column(String(255), nullable=True)
    resolution_notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    project = relationship("Project", back_populates="alerts")


class DuplicateCandidate(Base):
    __tablename__ = "duplicate_candidates"

    id = Column(Integer, primary_key=True, index=True)
    project_a_id = Column(String(100), ForeignKey("projects.project_id", ondelete="CASCADE"), nullable=False, index=True)
    project_b_id = Column(String(100), ForeignKey("projects.project_id", ondelete="CASCADE"), nullable=False, index=True)
    semantic_similarity = Column(Float, nullable=False)  # 0.0 - 1.0
    distance_km = Column(Float, nullable=False)          # Distance in km
    duplicate_score = Column(Float, nullable=False)      # 0.0 - 100.0
    status = Column(String(50), default=DuplicateStatusEnum.FLAGGED.value, nullable=False)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    project_a = relationship("Project", foreign_keys=[project_a_id])
    project_b = relationship("Project", foreign_keys=[project_b_id])


class ModelRun(Base):
    __tablename__ = "model_runs"

    id = Column(Integer, primary_key=True, index=True)
    model_name = Column(String(100), nullable=False)  # "Logistic Regression", "Random Forest", "XGBoost", "LightGBM", "Isolation Forest"
    model_type = Column(String(50), nullable=False)  # "SUPERVISED", "UNSUPERVISED"
    accuracy = Column(Float, nullable=True)
    precision = Column(Float, nullable=True)
    recall = Column(Float, nullable=True)
    f1_score = Column(Float, nullable=True)
    roc_auc = Column(Float, nullable=True)
    confusion_matrix_json = Column(Text, nullable=True)
    feature_importance_json = Column(Text, nullable=True)
    hyperparameters_json = Column(Text, nullable=True)
    is_active = Column(Boolean, default=False)
    trained_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=True)
    user_email = Column(String(255), nullable=True)
    action = Column(String(100), nullable=False)
    target_type = Column(String(100), nullable=False)
    target_id = Column(String(100), nullable=False)
    details = Column(Text, nullable=True)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc))
