import io
import re
import json
from datetime import datetime, timezone
from typing import Dict, Any, List, Tuple, Optional
import pandas as pd
from sqlalchemy.orm import Session
from app.db.models import Project, RiskScore, Alert
from app.services.ml.risk_engine import RiskEngine


STATE_NORMALIZATION_MAP = {
    "mh": "Maharashtra", "maharashtra": "Maharashtra", "maha": "Maharashtra",
    "mn": "Manipur", "manipur": "Manipur",
    "ka": "Karnataka", "karnataka": "Karnataka", "karnatka": "Karnataka",
    "up": "Uttar Pradesh", "uttar pradesh": "Uttar Pradesh", "u.p.": "Uttar Pradesh",
    "tn": "Tamil Nadu", "tamil nadu": "Tamil Nadu", "tamilnadu": "Tamil Nadu",
    "br": "Bihar", "bihar": "Bihar",
    "rj": "Rajasthan", "rajasthan": "Rajasthan",
    "as": "Assam", "assam": "Assam",
    "dl": "Delhi", "delhi": "Delhi", "nct of delhi": "Delhi",
    "kl": "Kerala", "kerala": "Kerala",
    "gj": "Gujarat", "gujarat": "Gujarat"
}


def normalize_currency_to_lakhs(val: Any) -> float:
    """
    Normalizes diverse Indian currency representations into Float Lakhs.
    Examples:
      '₹50,00,000' -> 50.0
      '50 Lakhs'   -> 50.0
      '1.5 Crore'  -> 150.0
      '25.4L'      -> 25.4
      '3000000'    -> 30.0
      35.5         -> 35.5
    """
    if val is None or pd.isna(val):
        return 0.0
    if isinstance(val, (int, float)):
        # If > 10,000, assume raw INR -> convert to Lakhs
        if val >= 10000:
            return round(float(val) / 100000.0, 2)
        return round(float(val), 2)

    s = str(val).strip().replace("₹", "").replace(",", "").lower()
    
    # Check for Crore
    cr_match = re.search(r'([\d\.]+)\s*(?:cr|crore|crores)', s)
    if cr_match:
        return round(float(cr_match.group(1)) * 100.0, 2)

    # Check for Lakh
    lakh_match = re.search(r'([\d\.]+)\s*(?:l|lac|lacs|lakh|lakhs)', s)
    if lakh_match:
        return round(float(lakh_match.group(1)), 2)

    # Pure number
    num_match = re.search(r'([\d\.]+)', s)
    if num_match:
        num = float(num_match.group(1))
        if num >= 10000:
            return round(num / 100000.0, 2)
        return round(num, 2)

    return 0.0


def normalize_date(val: Any) -> Optional[datetime]:
    if val is None or pd.isna(val):
        return None
    if isinstance(val, datetime):
        return val.replace(tzinfo=timezone.utc) if val.tzinfo is None else val
    
    s = str(val).strip()
    formats = [
        "%Y-%m-%d", "%d/%m/%Y", "%d-%m-%Y", "%m/%d/%Y",
        "%Y/%m/%d", "%d.%m.%Y", "%Y-%m-%dT%H:%M:%S"
    ]
    for fmt in formats:
        try:
            dt = datetime.strptime(s, fmt)
            return dt.replace(tzinfo=timezone.utc)
        except Exception:
            continue
    return None


def normalize_state(val: Any) -> str:
    if not val or pd.isna(val):
        return "Unknown"
    s = str(val).strip().lower()
    return STATE_NORMALIZATION_MAP.get(s, str(val).strip().title())


class IngestionService:
    """
    Handles CSV and Excel file ingestion, multi-field validation, normalization,
    quality scoring, and automatic risk recalculation.
    """

    def __init__(self, db: Session):
        self.db = db
        self.risk_engine = RiskEngine()

    def process_file(self, file_bytes: bytes, filename: str) -> Dict[str, Any]:
        # Read into dataframe
        try:
            if filename.endswith(".csv"):
                df = pd.read_csv(io.BytesIO(file_bytes))
            elif filename.endswith((".xlsx", ".xls")):
                df = pd.read_excel(io.BytesIO(file_bytes))
            else:
                return {
                    "total_records": 0, "valid_records": 0, "invalid_records": 0,
                    "duplicate_records": 0, "missing_fields_count": 0,
                    "data_quality_score": 0.0, "normalized_states_count": 0,
                    "normalized_currencies_count": 0, "validation_errors": [],
                    "message": "Unsupported file format. Please upload CSV or Excel (.xlsx)."
                }
        except Exception as e:
            return {
                "total_records": 0, "valid_records": 0, "invalid_records": 0,
                "duplicate_records": 0, "missing_fields_count": 0,
                "data_quality_score": 0.0, "normalized_states_count": 0,
                "normalized_currencies_count": 0, "validation_errors": [],
                "message": f"Error parsing spreadsheet: {str(e)}"
            }

        # Normalize column names
        df.columns = [str(c).strip().lower().replace(" ", "_").replace("-", "_") for c in df.columns]

        # Column aliases mapping
        col_map = {
            "id": "project_id", "project_code": "project_id", "work_code": "project_id",
            "mp": "mp_id", "mp_name": "mp_id", "member_of_parliament": "mp_id",
            "state_name": "state",
            "district_name": "district",
            "constituency_name": "constituency", "lok_sabha_constituency": "constituency",
            "type": "project_type", "sector": "project_type", "work_type": "project_type",
            "work_description": "description", "title": "description", "name": "description",
            "cost": "estimated_cost", "estimate": "estimated_cost",
            "sanctioned": "sanctioned_amount", "sanction_amount": "sanctioned_amount",
            "released": "released_amount", "funds_released": "released_amount",
            "spent": "expenditure", "expenditure_incurred": "expenditure",
            "agency": "implementing_agency", "dept": "implementing_agency", "executing_agency": "implementing_agency",
            "progress": "physical_progress", "physical": "physical_progress",
            "fin_progress": "financial_progress", "financial": "financial_progress",
            "start": "start_date", "sanction_date": "start_date",
            "completion_date": "expected_completion_date", "target_date": "expected_completion_date",
            "lat": "latitude", "long": "longitude", "lng": "longitude"
        }
        df = df.rename(columns=col_map)

        total_rows = len(df)
        valid_rows = []
        validation_errors = []
        duplicate_count = 0
        missing_fields_count = 0
        normalized_states_count = 0
        normalized_currencies_count = 0

        existing_pids = {p[0] for p in self.db.query(Project.project_id).all()}
        seen_batch_pids = set()

        for idx, row in df.iterrows():
            row_num = idx + 2  # 1-indexed accounting for header
            
            # Project ID
            raw_pid = row.get("project_id")
            if pd.isna(raw_pid) or not str(raw_pid).strip():
                pid = f"MPLAD-IMP-{row_num:04d}"
            else:
                pid = str(raw_pid).strip().upper()

            if pid in existing_pids or pid in seen_batch_pids:
                duplicate_count += 1
                pid = f"{pid}-DUP{row_num}"

            seen_batch_pids.add(pid)

            # Mandatory Fields Validation
            desc = str(row.get("description", "") or "").strip()
            if not desc or desc.lower() == "nan":
                missing_fields_count += 1
                validation_errors.append({
                    "row_number": row_num,
                    "field_name": "description",
                    "rejected_value": str(row.get("description")),
                    "reason": "Missing compulsory project description"
                })
                continue

            state_raw = row.get("state", "Maharashtra")
            state_norm = normalize_state(state_raw)
            if state_norm != str(state_raw).strip():
                normalized_states_count += 1

            district = str(row.get("district", "Central") or "Central").strip().title()
            constituency = str(row.get("constituency", "Central") or "Central").strip().title()
            ptype = str(row.get("project_type", "Community Infrastructure") or "Community Infrastructure").strip().title()
            agency = str(row.get("implementing_agency", "Public Works Department (PWD)") or "Public Works Department (PWD)").strip()
            mp_id = str(row.get("mp_id", f"MP-{state_norm[:2].upper()}-01") or f"MP-{state_norm[:2].upper()}-01").strip()

            # Coordinates
            try:
                lat = float(row.get("latitude", 19.0760))
                lon = float(row.get("longitude", 72.8777))
                if lat < 6.0 or lat > 38.0 or lon < 68.0 or lon > 98.0:
                    lat, lon = 19.0760, 72.8777
            except Exception:
                lat, lon = 19.0760, 72.8777

            # Amounts
            est_cost = normalize_currency_to_lakhs(row.get("estimated_cost", 25.0))
            sanct_cost = normalize_currency_to_lakhs(row.get("sanctioned_amount", est_cost or 25.0))
            rel_cost = normalize_currency_to_lakhs(row.get("released_amount", sanct_cost * 0.7))
            exp_cost = normalize_currency_to_lakhs(row.get("expenditure", sanct_cost * 0.5))
            normalized_currencies_count += 4

            # Dates
            now = datetime.now(timezone.utc)
            start_d = normalize_date(row.get("start_date")) or (now - pd.Timedelta(days=120))
            exp_d = normalize_date(row.get("expected_completion_date")) or (start_d + pd.Timedelta(days=240))
            act_d = normalize_date(row.get("actual_completion_date"))

            # Progress
            try:
                phys_prog = float(row.get("physical_progress", 50.0))
                phys_prog = min(100.0, max(0.0, phys_prog))
            except Exception:
                phys_prog = 50.0

            try:
                fin_prog = float(row.get("financial_progress", (exp_cost / max(1.0, sanct_cost)) * 100.0))
                fin_prog = min(100.0, max(0.0, fin_prog))
            except Exception:
                fin_prog = 50.0

            status = str(row.get("status", "IN_PROGRESS") or "IN_PROGRESS").upper()

            project_dict = {
                "project_id": pid,
                "mp_id": mp_id,
                "state": state_norm,
                "district": district,
                "constituency": constituency,
                "project_type": ptype,
                "description": desc,
                "latitude": lat,
                "longitude": lon,
                "estimated_cost": est_cost,
                "sanctioned_amount": sanct_cost,
                "released_amount": rel_cost,
                "expenditure": exp_cost,
                "start_date": start_d,
                "expected_completion_date": exp_d,
                "actual_completion_date": act_d,
                "physical_progress": phys_prog,
                "financial_progress": fin_prog,
                "implementing_agency": agency,
                "status": status,
                "synthetic_label": 0
            }
            valid_rows.append(project_dict)

        # Calculate data quality score
        if total_rows > 0:
            quality_score = round(((len(valid_rows) * 10 - len(validation_errors) * 2) / max(1, total_rows * 10)) * 100.0, 1)
            quality_score = max(0.0, min(100.0, quality_score))
        else:
            quality_score = 0.0

        # Save valid rows to DB
        created_projects = []
        for v in valid_rows:
            p = Project(**v)
            self.db.add(p)
            created_projects.append(p)
        self.db.commit()

        # Recalculate Risk Engine & Alerts for newly added projects
        if valid_rows:
            raw_dicts = [
                {
                    "project_id": v["project_id"],
                    "mp_id": v["mp_id"],
                    "state": v["state"],
                    "district": v["district"],
                    "constituency": v["constituency"],
                    "project_type": v["project_type"],
                    "description": v["description"],
                    "latitude": v["latitude"],
                    "longitude": v["longitude"],
                    "estimated_cost": v["estimated_cost"],
                    "sanctioned_amount": v["sanctioned_amount"],
                    "released_amount": v["released_amount"],
                    "expenditure": v["expenditure"],
                    "start_date": v["start_date"].isoformat(),
                    "expected_completion_date": v["expected_completion_date"].isoformat(),
                    "actual_completion_date": v["actual_completion_date"].isoformat() if v["actual_completion_date"] else None,
                    "physical_progress": v["physical_progress"],
                    "financial_progress": v["financial_progress"],
                    "implementing_agency": v["implementing_agency"],
                    "status": v["status"],
                    "synthetic_label": 0
                }
                for v in valid_rows
            ]

            scored_results = self.risk_engine.batch_score_projects(raw_dicts)
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
                self.db.add(rs)

                for alert_data in res["alerts"]:
                    alt = Alert(
                        project_id=p_id,
                        alert_type=alert_data["alert_type"],
                        severity=alert_data["severity"],
                        title=alert_data["title"],
                        description=alert_data["description"],
                        status="NEW"
                    )
                    self.db.add(alt)

            self.db.commit()

        return {
            "total_records": total_rows,
            "valid_records": len(valid_rows),
            "invalid_records": len(validation_errors),
            "duplicate_records": duplicate_count,
            "missing_fields_count": missing_fields_count,
            "data_quality_score": quality_score,
            "normalized_states_count": normalized_states_count,
            "normalized_currencies_count": normalized_currencies_count,
            "validation_errors": validation_errors[:15],
            "message": f"Successfully ingested {len(valid_rows)} of {total_rows} records with {quality_score}% Data Quality score."
        }
