# Technical Architecture Documentation

## System Topology & Data Flow

```
[ Frontend: React 18 + TS + Vite + Tailwind CSS + Recharts + Leaflet ]
                               |
                               | REST API (JWT Bearer Auth & Role Headers)
                               v
               [ Backend: FastAPI (Python 3.12/3.14) ]
                               |
          +--------------------+--------------------+
          |                    |                    |
          v                    v                    v
 [ Database & Storage ]   [ Anomaly & ML ]     [ NLP & GIS Engine ]
 - SQLite (Local zero-dev) - Rule Engine        - TF-IDF & Cosine Similarity
 - PostgreSQL + PostGIS    - Isolation Forest   - Haversine Geodesic Math
   (Docker production)     - Supervised Models  - Hotspot Cluster Detection
                             (LR, RF, XGB, LGBM)- Controlled AI Query Layer
```

---

## Component Specifications

### 1. Backend Engine (`/backend/app`)
- **FastAPI Core**: Asynchronous ASGI framework providing OpenAPI schema documentation, CORS control, and sub-second response times.
- **SQLAlchemy 2.0 ORM**: Type-safe relational mappings for Projects, Financial Records, Progress Records, Agencies, Risk Scores, Alerts, and Audit Logs.
- **Authentication & RBAC**: JWT Bearer tokens with bcrypt password hashing and 4-tier role enforcement (`ADMIN`, `ANALYST`, `INVESTIGATOR`, `VIEWER`).

### 2. Machine Learning & Anomaly Detection Pipeline (`/backend/app/services/ml`)
1. **Deterministic Rule Engine (`rule_engine.py`)**:
   - Evaluates hard legal and procedural thresholds:
     - Cost escalation (>20% warning, >50% critical)
     - Progress gap (Financial % - Physical % > 20% warning, >40% critical)
     - Timeline delay (>60 days warning, >180 days critical)
     - Disproportionate payment paces (>60% spent with <30% physical completion)
2. **Unsupervised Isolation Forest (`isolation_forest.py`)**:
   - Engineered features: Cost escalation ratio, progress mismatch, delay days, planned duration, expenditure per physical progress percentage, and expenditure burn rates.
   - Computes multivariate anomaly scores without requiring pre-existing fraud labels.
3. **Supervised Classifier Benchmarking (`supervised_models.py`)**:
   - Evaluates 4 candidate algorithms via Stratified 5-Fold Cross-Validation:
     1. Logistic Regression
     2. Random Forest
     3. XGBoost
     4. LightGBM
   - Computes Precision, Recall, F1-Score, ROC-AUC, 2x2 Confusion Matrices, and Gini Feature Importances.
   - Automatically selects and activates the best-performing model.
4. **Duplicate Project Detector (`duplicate_detector.py`)**:
   - Hybrid NLP semantic similarity (TF-IDF character & word n-grams + cosine similarity) combined with spatial geodesic proximity (Haversine formula).
   - Generates duplicate match probability scores (0-100%) and actionable inspection recommendations.
5. **Explainable Risk Engine (`risk_engine.py`)**:
   - Synthesizes all components into a weighted composite score (0-100) mapped to `LOW` (0-30), `MEDIUM` (31-60), `HIGH` (61-80), and `CRITICAL` (81-100) with bulleted human-readable rationales.

### 3. Frontend Architecture (`/frontend/src`)
- **Executive Dashboard**: Interactive KPI summary cards, Recharts risk donut, state-wise expenditure & risk distribution bar charts, delay histograms, and anomaly category breakdown.
- **Project Explorer**: Full-featured searchable data grid with multi-parameter filtering, progress visualizers, and CSV export.
- **Interactive GIS Map**: React-Leaflet with OpenStreetMap tiles, custom color-coded risk markers with pulsing critical indicators, marker clustering, anomaly hotspot circles, and duplicate vector link lines.
- **Project Detail Deep Dive**:
  - Executive summary & agency card
  - Financial overview (Sanctioned, Released, Expended)
  - Physical vs Financial progress comparison gauges
  - **Interactive Visual Timeline**: Recommendation &rarr; Sanction &rarr; Fund Release &rarr; Work Start &rarr; Payment Milestones &rarr; Physical Updates &rarr; Current Status
  - Multi-factor risk radar & explainable AI bullet breakdown
  - Active alerts list with one-click case triage modal
  - Potential duplicate candidate cards
- **Investigation Center**: Triage Kanban pipeline (`NEW`, `UNDER_REVIEW`, `INVESTIGATION_RECOMMENDED`, `RESOLVED`, `DISMISSED`) with inspector notes and audit trail.
- **Model Analytics**: Live model comparison benchmark table, ROC-AUC metrics, confusion matrices, and feature importance bar chart.
- **Controlled AI Assistant**: Natural language query router interpreting domain questions without raw LLM SQL execution.
- **Data Ingestion Hub**: Drag-and-drop CSV/Excel uploader, real-time multi-field normalization, Data Quality Health score meter, and demo dataset reset.
