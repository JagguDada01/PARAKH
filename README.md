<p align="center">
  <img src="frontend/public/parakh-logo.png" alt="PARAKH Logo" width="480" />
</p>

# PARAKH &bull; MPLADS AI Vigilance & Intelligence Platform
### Smart India Hackathon (SIH 2026) &bull; Problem Statement #102

> **PARAKH (परख)**: *Explainable Artificial Intelligence, Geospatial Risk Diagnostics, and Real-Time Anomaly Audit System for MPLAD Scheme Implementation.*

---

## 🌟 Executive Summary

The **PARAKH AI Vigilance Platform** is an enterprise-grade, explainable monitoring and decision-support web application designed for the **Ministry of Statistics and Programme Implementation (MoSPI)**, State Nodal Departments, District Authorities, and Vigilance Officers.

The platform continuously analyzes Member of Parliament Local Area Development Scheme (MPLADS) projects across all parliamentary constituencies to detect:
1. **Cost Escalations & Overruns** (above administrative sanctions)
2. **Timeline Backlogs & Critical Delays** (relative to scheduled target dates)
3. **Financial vs. Physical Progress Mismatches** (expenditure significantly outpacing ground execution)
4. **Disproportionate Payment Paces** (large upfront disbursements with minimal physical milestones)
5. **Semantic & Geospatial Duplicate Works** (overlapping sanctions for identical physical infrastructure within proximity)
6. **Geographic Hotspot Concentrations** (anomaly density clusters across specific districts/wards)
7. **Multivariate Unsupervised Outliers** (via Isolation Forest)
8. **Supervised Risk Predictions** (benchmark comparison of Logistic Regression, Random Forest, XGBoost, and LightGBM)

---

## 🛡️ Responsible AI & Ethical Design Principles

- **Investigative Support, Not Automated Accusation**: In strict compliance with procedural fairness, the system never declares "confirmed fraud." It labels issues as *Potential Anomaly*, *High-Risk Project*, *Potential Duplicate*, *Requires Verification*, or *Investigation Recommended*.
- **Demographic Neutrality**: Religion, caste, ethnicity, and gender are completely excluded from all schemas and models.
- **Political Impartiality**: MP identity and political affiliation are strictly excluded as predictive features in fraud-risk scoring.

---

## 🏗️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS, Lucide Icons, Recharts, React-Leaflet, Leaflet |
| **Backend** | Python (3.12/3.14), FastAPI, SQLAlchemy 2.0, Pydantic v2, Uvicorn, Bcrypt, PyJWT |
| **Machine Learning** | scikit-learn, XGBoost, LightGBM, Isolation Forest, Sentence Transformers / TF-IDF NLP |
| **Database** | SQLite (zero-setup local development) / PostgreSQL 16 + PostGIS 3.4 (production) |
| **Containerization** | Docker, Docker Compose, Nginx |

---

## 🚀 Quick Start Guide

### Prerequisites
- **Python 3.11+**
- **Node.js 18+** and **npm**
- *(Optional for containerized run)* **Docker & Docker Compose**

---

### Method 1: Local Development Run (Fastest)

#### 1. Backend Setup
```bash
# 1. Create and activate Python virtual environment
python3 -m venv .venv
source .venv/bin/activate

# 2. Install dependencies
pip install -r backend/requirements.txt

# 3. Start FastAPI backend (runs on http://localhost:8000)
# Auto-creates database schema and seeds 140+ realistic synthetic projects with deliberate anomalies
PYTHONPATH=backend uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

#### 2. Frontend Setup (in a new terminal)
```bash
# 1. Navigate to frontend directory and install dependencies
cd frontend
npm install

# 2. Start Vite development server (runs on http://localhost:5173)
npm run dev
```

Open your browser at: **http://localhost:5173**

---

### Method 2: Docker Compose (Full Production Stack)

```bash
docker-compose up --build
```
- Frontend Web App: `http://localhost:3000`
- FastAPI Backend API: `http://localhost:8000`
- OpenAPI Swagger Docs: `http://localhost:8000/docs`
- PostGIS Database: `localhost:5432`

---

## 👤 One-Click Evaluator Demo Accounts

On the login page, you can either click the **One-Click Role Quick Login** pills or enter credentials:

| Role | Email | Password | Permissions & Capabilities |
|---|---|---|---|
| **Investigator** | `investigator@mplads.gov.in` | `Investigator@123` | Case triage, evidence audit, inspector note taking |
| **Analyst** | `analyst@mplads.gov.in` | `Analyst@123` | ML model benchmarking, threshold sandbox simulation |
| **Admin** | `admin@mplads.gov.in` | `Admin@123` | Full system access, data ingestion & dataset reset |
| **Viewer** | `viewer@mplads.gov.in` | `Viewer@123` | Read-only executive dashboard & GIS visualizer |

---

## 🧪 Automated Testing Suite

Execute the comprehensive test suite verifying ML models, risk engines, anomaly rules, duplicate detectors, RBAC, and API endpoints:

```bash
# Run pytest test suite
PYTHONPATH=backend .venv/bin/pytest backend/tests/ -v

# Run frontend TypeScript type-check and build
cd frontend && npm run build
```

---

## 🎯 15-Step SIH Demonstration Flow

1. **Login & Role Switcher**:
   - Access the portal at `http://localhost:5173` and click **Central Vigilance Investigator**.
2. **Executive Overview Dashboard**:
   - View national KPI metrics (Total Projects, ₹ Expenditure in Crores, Risk breakdown, Delays, Duplicates).
   - Inspect interactive Recharts charts (Risk Severity Donut, State-wise Projects Bar, Delay Histogram, Anomaly Category Distribution).
3. **Filter High-Risk Projects**:
   - Navigate to **Project Explorer** and filter by Risk Rating: `CRITICAL` or `HIGH`.
4. **Open a Flagged Project Deep Dive**:
   - Click on a flagged high-risk project (e.g., in Manipur, Maharashtra, or UP).
5. **Inspect Explainable Risk Drivers**:
   - View transparent multi-factor breakdown (Cost Escalation %, Progress Gap %, Delay Days, Payment Pace).
6. **Interact with Execution Timeline**:
   - Review the chronological lifecycle timeline:
     *Recommendation &rarr; Sanction &rarr; Fund Release &rarr; Work Start &rarr; Payment Milestones &rarr; Physical Updates &rarr; Current Status*.
7. **Examine Financial & Progress Gauges**:
   - Compare Sanctioned vs. Expended amounts alongside Physical vs. Financial progress bars.
8. **Inspect Potential Duplicate Candidates**:
   - Review duplicate matching candidates flagged by semantic similarity (e.g. 94% text match) and geospatial distance (<1 km).
9. **Launch Interactive GIS Map**:
   - Navigate to **GIS Interactive Map** to view custom-coded risk pins with pulsating critical markers.
10. **Explore Hotspots & Duplicate Vector Links**:
    - Toggle **Duplicate Vectors** (dashed purple link lines) and **Hotspots** (red anomaly density circles).
11. **Test Controlled Natural Language AI Assistant**:
    - Navigate to **AI Assistant** and click prompt pills or type questions:
      - *"Show high-risk projects in Manipur"*
      - *"Why is project MPLAD-1001 high risk?"*
      - *"Find projects with more than 30% cost escalation"*
      - *"Which districts have the highest delay rate?"*
      - *"Find potential duplicate projects within 1 km"*
      - *"Show projects where financial progress is above 80% and physical progress is below 40%"*
12. **Review Model Benchmark Comparison**:
    - Navigate to **Model Analytics** to view the live benchmark table comparing **Logistic Regression, Random Forest, XGBoost, and LightGBM**.
    - Inspect ROC-AUC scores, Precision, Recall, F1-Scores, 2x2 Confusion Matrices, and Gini Feature Importances.
13. **Adjust Configurable Thresholds**:
    - Navigate to **Risk Center** and adjust the sensitivity sliders (Cost Overrun %, Progress Gap %, Delay Cutoff Days). Click **Apply & Recalculate Scores** to observe real-time dynamic re-scoring.
14. **Perform Investigation Case Triage**:
    - Navigate to **Investigation Center**, select an active alert, and click **Triage Case**.
    - Update the status to `UNDER_REVIEW` or `INVESTIGATION_RECOMMENDED`, enter inspector notes, and confirm the immutable audit trail record.
15. **Test Data Ingestion Hub**:
    - Navigate to **Data Ingestion Hub**, download the sample CSV template, upload spreadsheets, and view the automated Data Quality Health Score meter.

---

## 📁 Repository Structure

```
SIH/
├── backend/                    # FastAPI Python Backend
│   ├── app/
│   │   ├── api/                # API Routers (auth, projects, analytics, alerts, duplicates, ml, ai, ingestion, risk)
│   │   ├── core/               # Configuration, security, JWT, RBAC
│   │   ├── db/                 # Database models & SQLAlchemy sessions
│   │   ├── schemas/            # Pydantic validation & response models
│   │   ├── services/           # ML services, rule engine, isolation forest, duplicate detector, AI query engine
│   │   └── main.py             # FastAPI entrypoint with lifespan startup
│   ├── tests/                  # Pytest automated test suite
│   └── requirements.txt        # Frozen Python dependencies
├── frontend/                   # React 18 + TypeScript + Vite + Tailwind Frontend
│   ├── src/
│   │   ├── components/         # Reusable UI components (Navbar, Sidebar, RiskBadge, StatCard, etc.)
│   │   ├── context/            # AuthContext with role switcher
│   │   ├── pages/              # 9 core screens + Ingestion screen + Login
│   │   ├── services/           # Typed API service client
│   │   ├── types/              # TypeScript interfaces
│   │   ├── App.tsx             # Main routing & layout controller
│   │   └── main.tsx            # React root mount
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.ts
├── docker/                     # Docker & Nginx deployment files
│   ├── Dockerfile.backend
│   ├── Dockerfile.frontend
│   └── nginx.conf
├── docs/                       # Technical and architectural documentation
│   ├── ARCHITECTURE.md
│   └── RESPONSIBLE_AI.md
├── docker-compose.yml          # Containerized deployment orchestration
├── .env.example                # Configuration environment template
└── README.md                   # Project documentation
```

---

## 🏛️ Ministry & SIH Attribution
Developed for **Smart India Hackathon 2026** under Problem Statement #102: **"Development of an AI-powered system to detect anomalies, fraud, and inefficiencies in MPLAD Scheme implementation."**
