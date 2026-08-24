import random
import json
from datetime import datetime, timedelta, timezone
from typing import List, Dict, Any
from sqlalchemy.orm import Session
from app.db.models import (
    User, UserRole, Project, FinancialRecord, ProgressRecord, Agency,
    RiskScore, Alert, DuplicateCandidate, ModelRun
)
from app.core.security import get_password_hash
from app.services.ml.risk_engine import RiskEngine
from app.services.ml.supervised_models import SupervisedModelBenchmarker


STATES_DATA = {
    "Maharashtra": {
        "districts": ["Pune", "Nagpur", "Nashik", "Thane", "Aurangabad", "Kolhapur"],
        "constituencies": ["Pune City", "Nagpur South", "Nashik Central", "Thane West", "Aurangabad East"],
        "lat_range": (18.5, 21.2),
        "lon_range": (73.8, 79.1),
    },
    "Manipur": {
        "districts": ["Imphal West", "Imphal East", "Thoubal", "Bishnupur", "Churachandpur", "Kakching"],
        "constituencies": ["Inner Manipur", "Outer Manipur", "Imphal Central", "Thoubal South", "Churachandpur Hill"],
        "lat_range": (24.3, 25.1),
        "lon_range": (93.7, 94.4),
    },
    "Karnataka": {
        "districts": ["Bengaluru Urban", "Mysuru", "Dharwad", "Belagavi", "Mangaluru", "Hubballi"],
        "constituencies": ["Bangalore South", "Bangalore Central", "Mysore-Kodagu", "Dharwad North", "Dakshina Kannada"],
        "lat_range": (12.8, 15.5),
        "lon_range": (74.8, 77.6),
    },
    "Uttar Pradesh": {
        "districts": ["Lucknow", "Varanasi", "Kanpur Nagar", "Gorakhpur", "Prayagraj", "Agra"],
        "constituencies": ["Lucknow City", "Varanasi Cantt", "Kanpur Central", "Gorakhpur Urban", "Prayagraj South"],
        "lat_range": (25.3, 27.2),
        "lon_range": (80.3, 83.0),
    },
    "Tamil Nadu": {
        "districts": ["Chennai", "Coimbatore", "Madurai", "Tiruchirappalli", "Salem"],
        "constituencies": ["Chennai South", "Coimbatore North", "Madurai Central", "Tiruchirappalli East"],
        "lat_range": (9.9, 13.1),
        "lon_range": (76.9, 80.3),
    },
    "Bihar": {
        "districts": ["Patna", "Gaya", "Muzaffarpur", "Bhagalpur", "Darbhanga"],
        "constituencies": ["Patna Sahib", "Gaya Town", "Muzaffarpur Central", "Bhagalpur East"],
        "lat_range": (24.7, 26.2),
        "lon_range": (84.9, 87.0),
    },
    "Rajasthan": {
        "districts": ["Jaipur", "Jodhpur", "Udaipur", "Kota", "Bikaner"],
        "constituencies": ["Jaipur Urban", "Jodhpur Central", "Udaipur Rural", "Kota North"],
        "lat_range": (24.5, 27.0),
        "lon_range": (73.0, 75.8),
    },
    "Assam": {
        "districts": ["Kamrup Metropolitan", "Dibrugarh", "Silchar", "Jorhat", "Nagaon"],
        "constituencies": ["Gauhati East", "Dibrugarh Central", "Silchar Valley", "Jorhat Urban"],
        "lat_range": (24.8, 27.5),
        "lon_range": (91.7, 94.9),
    }
}

PROJECT_TYPES = [
    "Drinking Water & Tube Wells",
    "Rural Roads & Bridges",
    "Community Halls & Centres",
    "Primary Healthcare Centers",
    "Government School Classrooms",
    "Solar Street Lighting",
    "Public Sanitation Facilities",
    "Irrigation & Check Dams",
    "Skill Training Centers",
    "Public Library Buildings"
]

AGENCIES = [
    "Public Works Department (PWD)",
    "Rural Development Agency (DRDA)",
    "Zilla Parishad Engineering Cell",
    "Municipal Infrastructure Corporation",
    "Irrigation & Water Resources Dept",
    "State Education Infrastructure Board",
    "Renewable Energy Development Agency"
]


def generate_synthetic_data(db: Session, num_projects: int = 140) -> Dict[str, int]:
    """
    Generates a realistic, multifaceted synthetic MPLADS dataset for demonstration.
    Explicitly marked as DEMO/SYNTHETIC data.
    """
    random.seed(42)
    now = datetime.now(timezone.utc)

    # 1. Create Default Users for Instant Testing
    default_users = [
        ("admin@mplads.gov.in", "Admin@123", "National Admin Officer", UserRole.ADMIN.value),
        ("analyst@mplads.gov.in", "Analyst@123", "Chief Data Analyst", UserRole.ANALYST.value),
        ("investigator@mplads.gov.in", "Investigator@123", "Central Vigilance Investigator", UserRole.INVESTIGATOR.value),
        ("viewer@mplads.gov.in", "Viewer@123", "Public Oversight Auditor", UserRole.VIEWER.value),
    ]

    for email, pwd, name, role in default_users:
        existing = db.query(User).filter(User.email == email).first()
        if not existing:
            u = User(
                email=email,
                hashed_password=get_password_hash(pwd),
                full_name=name,
                role=role,
                is_active=True
            )
            db.add(u)
    db.commit()

    # 2. Create Agencies
    agency_objs = {}
    for state in STATES_DATA.keys():
        for agency_name in AGENCIES:
            key = f"{agency_name} - {state}"
            ag = db.query(Agency).filter(Agency.name == key).first()
            if not ag:
                ag = Agency(
                    name=key,
                    state=state,
                    district=random.choice(STATES_DATA[state]["districts"]),
                    performance_score=round(random.uniform(70.0, 96.0), 1),
                    total_projects=0,
                    delayed_projects=0
                )
                db.add(ag)
            agency_objs[key] = ag
    db.commit()

    # 3. Create Structured Projects with Controlled Anomaly Archetypes
    # Archetype 1: Normal On-Track Project (60%)
    # Archetype 2: Cost Escalation Anomaly (12%)
    # Archetype 3: Progress Gap & Payment Spike Anomaly (10%)
    # Archetype 4: Critical Delay & Stalled Project (10%)
    # Archetype 5: Semantic & Geographic Duplicate Project Pair (8%)

    raw_projects = []
    
    # State distribution
    state_list = list(STATES_DATA.keys())
    p_counter = 1001

    # Deliberate Duplicate Pairs setup
    duplicate_pairs_definitions = [
        {
            "state": "Manipur", "district": "Imphal West", "constituency": "Inner Manipur",
            "base_lat": 24.8170, "base_lon": 93.9368,
            "title_a": "Construction of Multipurpose Community Hall at Awang Leikai, Village Kwakeithel",
            "title_b": "Erection of Community Resource Center and Social Hall at Kwakeithel Awang Leikai",
            "type": "Community Halls & Centres", "cost": 45.0
        },
        {
            "state": "Maharashtra", "district": "Pune", "constituency": "Pune City",
            "base_lat": 18.5204, "base_lon": 73.8567,
            "title_a": "Installation of 50 Solar High-Mast Street Lights across Ward 14 Haveli",
            "title_b": "Erection of 50 Nos Solar Street Lighting Units in Haveli Ward No 14",
            "type": "Solar Street Lighting", "cost": 30.0
        },
        {
            "state": "Karnataka", "district": "Bengaluru Urban", "constituency": "Bangalore South",
            "base_lat": 12.9249, "base_lon": 77.5838,
            "title_a": "Deep Borewell with RO Drinking Water Purification Plant at Jayanagar 4th Block",
            "title_b": "Drinking Water RO Dispenser Plant with Submersible Borewell, Jayanagar Block 4",
            "type": "Drinking Water & Tube Wells", "cost": 25.0
        },
        {
            "state": "Uttar Pradesh", "district": "Varanasi", "constituency": "Varanasi Cantt",
            "base_lat": 25.3176, "base_lon": 82.9739,
            "title_a": "Construction of 4 Additional Classrooms at Primary School Shivpur",
            "title_b": "Shivpur Govt Primary School Four Room Educational Extension Building",
            "type": "Government School Classrooms", "cost": 50.0
        }
    ]

    created_pids = set()

    for dup in duplicate_pairs_definitions:
        st = dup["state"]
        dist = dup["district"]
        const = dup["constituency"]
        ptype = dup["type"]
        base_c = dup["cost"]

        pid_a = f"MPLAD-{p_counter}"
        p_counter += 1
        pid_b = f"MPLAD-{p_counter}"
        p_counter += 1

        start_a = now - timedelta(days=random.randint(180, 300))
        exp_a = start_a + timedelta(days=240)
        
        start_b = now - timedelta(days=random.randint(90, 200))
        exp_b = start_b + timedelta(days=240)

        # Project A
        raw_projects.append({
            "project_id": pid_a,
            "mp_id": f"MP-{st[:2].upper()}-{random.randint(10, 99)}",
            "state": st,
            "district": dist,
            "constituency": const,
            "project_type": ptype,
            "description": dup["title_a"],
            "latitude": round(dup["base_lat"], 5),
            "longitude": round(dup["base_lon"], 5),
            "estimated_cost": base_c,
            "sanctioned_amount": base_c,
            "released_amount": round(base_c * 0.8, 2),
            "expenditure": round(base_c * 0.75, 2),
            "start_date": start_a,
            "expected_completion_date": exp_a,
            "actual_completion_date": None,
            "physical_progress": 70.0,
            "financial_progress": 75.0,
            "implementing_agency": f"Public Works Department (PWD) - {st}",
            "status": "IN_PROGRESS",
            "synthetic_label": 1
        })

        # Project B (shifted by ~400 meters)
        raw_projects.append({
            "project_id": pid_b,
            "mp_id": f"MP-{st[:2].upper()}-{random.randint(10, 99)}",
            "state": st,
            "district": dist,
            "constituency": const,
            "project_type": ptype,
            "description": dup["title_b"],
            "latitude": round(dup["base_lat"] + 0.0035, 5),
            "longitude": round(dup["base_lon"] + 0.0028, 5),
            "estimated_cost": base_c * 1.05,
            "sanctioned_amount": base_c * 1.05,
            "released_amount": round(base_c * 0.6, 2),
            "expenditure": round(base_c * 0.55, 2),
            "start_date": start_b,
            "expected_completion_date": exp_b,
            "actual_completion_date": None,
            "physical_progress": 45.0,
            "financial_progress": 55.0,
            "implementing_agency": f"Rural Development Agency (DRDA) - {st}",
            "status": "IN_PROGRESS",
            "synthetic_label": 1
        })

    # Now generate remaining projects up to num_projects
    while len(raw_projects) < num_projects:
        pid = f"MPLAD-{p_counter}"
        p_counter += 1

        state = random.choice(state_list)
        s_info = STATES_DATA[state]
        district = random.choice(s_info["districts"])
        constituency = random.choice(s_info["constituencies"])
        ptype = random.choice(PROJECT_TYPES)
        agency = f"{random.choice(AGENCIES)} - {state}"
        mp_id = f"MP-{state[:2].upper()}-{random.randint(10, 99)}"

        lat = round(random.uniform(*s_info["lat_range"]), 5)
        lon = round(random.uniform(*s_info["lon_range"]), 5)

        base_cost = round(random.uniform(15.0, 120.0), 2)  # Lakhs
        sanctioned = base_cost

        # Determine Archetype
        roll = random.random()

        if roll < 0.55:
            # 1. Normal Healthy Project
            duration_days = random.randint(120, 360)
            elapsed_days = random.randint(30, 400)
            start_date = now - timedelta(days=elapsed_days)
            exp_date = start_date + timedelta(days=duration_days)

            if elapsed_days >= duration_days:
                # Completed
                status = "COMPLETED"
                phys = 100.0
                fin = round(random.uniform(95.0, 100.0), 1)
                expended = round(sanctioned * (fin / 100.0), 2)
                released = sanctioned
                act_date = exp_date + timedelta(days=random.randint(-15, 10))
            else:
                status = "IN_PROGRESS"
                prog = min(95.0, (elapsed_days / duration_days) * 100.0)
                phys = round(prog + random.uniform(-5, 5), 1)
                fin = round(prog + random.uniform(-4, 6), 1)
                phys = max(5.0, min(95.0, phys))
                fin = max(5.0, min(95.0, fin))
                expended = round(sanctioned * (fin / 100.0), 2)
                released = round(sanctioned * min(1.0, (fin + 15.0) / 100.0), 2)
                act_date = None

            synth_label = 0
            desc = f"Construction of {ptype.lower()} at {district} central block."

        elif roll < 0.70:
            # 2. Cost Escalation Anomaly (Expenditure exceeds sanctioned by 25% - 75%)
            escalation_pct = random.uniform(25.0, 75.0)
            expended = round(sanctioned * (1.0 + escalation_pct / 100.0), 2)
            released = round(expended * 1.05, 2)
            start_date = now - timedelta(days=random.randint(180, 450))
            exp_date = start_date + timedelta(days=240)
            phys = round(random.uniform(40.0, 75.0), 1)
            fin = 100.0
            status = "IN_PROGRESS"
            act_date = None
            synth_label = 1
            desc = f"Upgradation and expansion of {ptype.lower()} in {constituency} sector with heavy cost escalation."

        elif roll < 0.82:
            # 3. Progress Gap & Disproportionate Payment Spike (Financial 85%, Physical 20%)
            start_date = now - timedelta(days=random.randint(120, 300))
            exp_date = start_date + timedelta(days=200)
            fin = round(random.uniform(75.0, 95.0), 1)
            phys = round(random.uniform(10.0, 30.0), 1)
            expended = round(sanctioned * (fin / 100.0), 2)
            released = round(sanctioned * (fin / 100.0), 2)
            status = "IN_PROGRESS"
            act_date = None
            synth_label = 1
            desc = f"Development of {ptype.lower()} at {district} outskirts with abnormal upfront fund depletion."

        else:
            # 4. Critical Delay & Stalled Project (>180 days delayed, progress frozen)
            delay_days = random.randint(180, 420)
            duration_days = 180
            start_date = now - timedelta(days=duration_days + delay_days)
            exp_date = start_date + timedelta(days=duration_days)
            phys = round(random.uniform(15.0, 50.0), 1)
            fin = round(random.uniform(40.0, 65.0), 1)
            expended = round(sanctioned * (fin / 100.0), 2)
            released = round(sanctioned * 0.7, 2)
            status = "STALLED" if random.random() < 0.5 else "DELAYED"
            act_date = None
            synth_label = 1
            desc = f"Pending execution of {ptype.lower()} near {district} highway junction (unresolved timeline delay)."

        raw_projects.append({
            "project_id": pid,
            "mp_id": mp_id,
            "state": state,
            "district": district,
            "constituency": constituency,
            "project_type": ptype,
            "description": desc,
            "latitude": lat,
            "longitude": lon,
            "estimated_cost": base_cost,
            "sanctioned_amount": sanctioned,
            "released_amount": released,
            "expenditure": expended,
            "start_date": start_date,
            "expected_completion_date": exp_date,
            "actual_completion_date": act_date,
            "physical_progress": phys,
            "financial_progress": fin,
            "implementing_agency": agency,
            "status": status,
            "synthetic_label": synth_label
        })

    # Clear existing and save to DB
    db.query(Alert).delete()
    db.query(DuplicateCandidate).delete()
    db.query(RiskScore).delete()
    db.query(FinancialRecord).delete()
    db.query(ProgressRecord).delete()
    db.query(Project).delete()
    db.query(ModelRun).delete()
    db.commit()

    project_entities = []
    for rp in raw_projects:
        p = Project(
            project_id=rp["project_id"],
            mp_id=rp["mp_id"],
            state=rp["state"],
            district=rp["district"],
            constituency=rp["constituency"],
            project_type=rp["project_type"],
            description=rp["description"],
            latitude=rp["latitude"],
            longitude=rp["longitude"],
            estimated_cost=rp["estimated_cost"],
            sanctioned_amount=rp["sanctioned_amount"],
            released_amount=rp["released_amount"],
            expenditure=rp["expenditure"],
            start_date=rp["start_date"],
            expected_completion_date=rp["expected_completion_date"],
            actual_completion_date=rp["actual_completion_date"],
            physical_progress=rp["physical_progress"],
            financial_progress=rp["financial_progress"],
            implementing_agency=rp["implementing_agency"],
            status=rp["status"],
            synthetic_label=rp["synthetic_label"]
        )
        db.add(p)
        project_entities.append(p)
    db.commit()

    # 4. Generate Financial and Progress Records for each project
    for p in project_entities:
        # Initial Sanction
        db.add(FinancialRecord(
            project_id=p.project_id,
            transaction_type="SANCTION",
            amount=p.sanctioned_amount,
            date=p.start_date - timedelta(days=random.randint(15, 45)),
            description=f"Administrative and Financial Sanction under MPLADS Scheme",
            payee="District Collectorate MPLADS Account",
            reference_number=f"SANCT-{p.project_id[-4:]}-2024"
        ))

        # First Installment Release (50%)
        rel1_amount = round(p.sanctioned_amount * 0.5, 2)
        db.add(FinancialRecord(
            project_id=p.project_id,
            transaction_type="RELEASE",
            amount=rel1_amount,
            date=p.start_date,
            description="Release of 1st Installment (50%) to Implementing Agency",
            payee=p.implementing_agency,
            reference_number=f"REL1-{p.project_id[-4:]}-2024"
        ))

        # Contractor Payment
        if p.expenditure > 0:
            db.add(FinancialRecord(
                project_id=p.project_id,
                transaction_type="CONTRACTOR_PAYMENT",
                amount=p.expenditure,
                date=p.start_date + timedelta(days=random.randint(20, 60)),
                description="Milestone Contractor Running Account Bill Payment",
                payee=f"Authorized Infrastructure Contractor",
                reference_number=f"PAY-{p.project_id[-4:]}-01"
            ))

        # Progress inspection records
        insp_date1 = p.start_date + timedelta(days=30)
        db.add(ProgressRecord(
            project_id=p.project_id,
            inspection_date=insp_date1,
            physical_percentage=min(p.physical_progress, 25.0),
            financial_percentage=min(p.financial_progress, 30.0),
            remarks="Initial foundation laying and site inspection conducted.",
            inspector_name="Er. S. Sharma (Asst Engineer)",
            photos_count=3
        ))

        if p.physical_progress > 30.0:
            insp_date2 = p.start_date + timedelta(days=90)
            db.add(ProgressRecord(
                project_id=p.project_id,
                inspection_date=insp_date2,
                physical_percentage=p.physical_progress,
                financial_percentage=p.financial_progress,
                remarks=f"Mid-term physical verification: Work at {p.physical_progress}% completion.",
                inspector_name="Er. R. Patel (Executive Engineer)",
                photos_count=4
            ))

    db.commit()

    # 5. Run ML Risk Engine & Anomaly Detection Pipeline
    risk_engine = RiskEngine()
    project_dicts = [
        {
            "project_id": p.project_id,
            "mp_id": p.mp_id,
            "state": p.state,
            "district": p.district,
            "constituency": p.constituency,
            "project_type": p.project_type,
            "description": p.description,
            "latitude": p.latitude,
            "longitude": p.longitude,
            "estimated_cost": p.estimated_cost,
            "sanctioned_amount": p.sanctioned_amount,
            "released_amount": p.released_amount,
            "expenditure": p.expenditure,
            "start_date": p.start_date.isoformat(),
            "expected_completion_date": p.expected_completion_date.isoformat(),
            "actual_completion_date": p.actual_completion_date.isoformat() if p.actual_completion_date else None,
            "physical_progress": p.physical_progress,
            "financial_progress": p.financial_progress,
            "implementing_agency": p.implementing_agency,
            "status": p.status,
            "synthetic_label": p.synthetic_label
        }
        for p in project_entities
    ]

    scored_results = risk_engine.batch_score_projects(project_dicts)

    # Save RiskScores and Alerts to DB
    for res in scored_results:
        p_id = res["project_id"]
        rs = RiskScore(
            project_id=p_id,
            overall_score=res["overall_score"],
            risk_level=res["risk_level"],
            cost_risk=res["cost_risk"],
            delay_risk=res["delay_risk"],
            progress_gap_risk=res["progress_gap_risk"],
            payment_risk=res["payment_risk"],
            duplicate_risk=res["duplicate_risk"],
            geo_risk=res["geo_risk"],
            ml_risk=res["ml_risk"],
            reasons_json=json.dumps(res["reasons"])
        )
        db.add(rs)

        # Alerts
        for alert_data in res["alerts"]:
            alt = Alert(
                project_id=p_id,
                alert_type=alert_data["alert_type"],
                severity=alert_data["severity"],
                title=alert_data["title"],
                description=alert_data["description"],
                status="NEW"
            )
            db.add(alt)

    # 6. Save Duplicate Candidates
    dup_candidates = risk_engine.duplicate_detector.find_potential_duplicates(project_dicts)
    for cand in dup_candidates:
        dc = DuplicateCandidate(
            project_a_id=cand["project_a_id"],
            project_b_id=cand["project_b_id"],
            semantic_similarity=cand["semantic_similarity"],
            distance_km=cand["distance_km"],
            duplicate_score=cand["duplicate_score"],
            status="FLAGGED",
            notes=cand["notes"]
        )
        db.add(dc)

    # 7. Train and Store Supervised ML Model Comparison Results
    benchmarker = SupervisedModelBenchmarker()
    comparison_res = benchmarker.train_and_evaluate_all(project_dicts)
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

    return {
        "projects_created": len(project_entities),
        "alerts_generated": db.query(Alert).count(),
        "duplicates_identified": db.query(DuplicateCandidate).count(),
        "models_benchmarked": len(comparison_res.get("models", []))
    }
