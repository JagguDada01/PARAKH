from datetime import datetime, timezone
from typing import List, Dict, Any
from app.core.config import settings


class RuleBasedAnomalyEngine:
    """
    Evaluates rule-based constraints on MPLADS projects to detect potential
    irregularities, cost escalations, delays, progress gaps, and payment anomalies.
    """

    def __init__(self, config=None):
        self.cfg = config or settings

    def evaluate_project(self, project_dict: Dict[str, Any], all_projects: List[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Evaluate a single project against deterministic monitoring rules.
        Returns a dict with flags, rule scores, and human-readable anomaly descriptions.
        """
        reasons = []
        alerts_to_generate = []
        
        # 1. Cost Escalation Rule
        estimated = float(project_dict.get("estimated_cost", 0.0) or 0.0)
        sanctioned = float(project_dict.get("sanctioned_amount", 0.0) or 0.0)
        expended = float(project_dict.get("expenditure", 0.0) or 0.0)
        
        baseline_cost = sanctioned if sanctioned > 0 else estimated
        cost_escalation_pct = 0.0
        cost_risk_score = 0.0
        
        if baseline_cost > 0:
            if expended > baseline_cost:
                cost_escalation_pct = ((expended - baseline_cost) / baseline_cost) * 100.0
                
            if cost_escalation_pct >= self.cfg.COST_OVERRUN_CRIT_PCT:
                cost_risk_score = 95.0
                msg = f"{cost_escalation_pct:.1f}% cost escalation above sanctioned amount (Sanctioned: ₹{baseline_cost:.2f}L, Expended: ₹{expended:.2f}L)"
                reasons.append(msg)
                alerts_to_generate.append({
                    "alert_type": "COST_OVERRUN",
                    "severity": "CRITICAL",
                    "title": "Critical Cost Escalation",
                    "description": msg
                })
            elif cost_escalation_pct >= self.cfg.COST_OVERRUN_WARN_PCT:
                cost_risk_score = 65.0
                msg = f"{cost_escalation_pct:.1f}% cost escalation above sanctioned amount (Sanctioned: ₹{baseline_cost:.2f}L, Expended: ₹{expended:.2f}L)"
                reasons.append(msg)
                alerts_to_generate.append({
                    "alert_type": "COST_OVERRUN",
                    "severity": "HIGH",
                    "title": "High Cost Escalation",
                    "description": msg
                })
            elif cost_escalation_pct > 5.0:
                cost_risk_score = 30.0

        # 2. Financial vs Physical Progress Gap Rule
        physical_prog = float(project_dict.get("physical_progress", 0.0) or 0.0)
        financial_prog = float(project_dict.get("financial_progress", 0.0) or 0.0)
        progress_gap = financial_prog - physical_prog
        progress_gap_risk_score = 0.0

        if progress_gap >= self.cfg.PROGRESS_GAP_CRIT_PCT:
            progress_gap_risk_score = 90.0
            msg = f"{progress_gap:.1f}% progress mismatch (Financial: {financial_prog:.1f}%, Physical: {physical_prog:.1f}%)"
            reasons.append(msg)
            alerts_to_generate.append({
                "alert_type": "PROGRESS_GAP",
                "severity": "CRITICAL",
                "title": "Severe Financial-Physical Progress Discrepancy",
                "description": msg
            })
        elif progress_gap >= self.cfg.PROGRESS_GAP_WARN_PCT:
            progress_gap_risk_score = 60.0
            msg = f"{progress_gap:.1f}% progress mismatch (Financial: {financial_prog:.1f}%, Physical: {physical_prog:.1f}%)"
            reasons.append(msg)
            alerts_to_generate.append({
                "alert_type": "PROGRESS_GAP",
                "severity": "HIGH",
                "title": "Progress Mismatch Flag",
                "description": msg
            })
        elif progress_gap > 10.0:
            progress_gap_risk_score = 25.0

        # 3. Timeline Delay Rule
        expected_date = project_dict.get("expected_completion_date")
        actual_date = project_dict.get("actual_completion_date")
        status = project_dict.get("status", "IN_PROGRESS")
        
        delay_days = 0
        delay_risk_score = 0.0
        
        now = datetime.now(timezone.utc)
        if isinstance(expected_date, str):
            try:
                expected_date = datetime.fromisoformat(expected_date.replace("Z", "+00:00"))
            except Exception:
                expected_date = None

        if expected_date:
            if expected_date.tzinfo is None:
                expected_date = expected_date.replace(tzinfo=timezone.utc)
                
            if status != "COMPLETED" and physical_prog < 100.0:
                if now > expected_date:
                    delay_days = (now - expected_date).days
            elif actual_date:
                if isinstance(actual_date, str):
                    try:
                        actual_date = datetime.fromisoformat(actual_date.replace("Z", "+00:00"))
                    except Exception:
                        actual_date = None
                if actual_date:
                    if actual_date.tzinfo is None:
                        actual_date = actual_date.replace(tzinfo=timezone.utc)
                    if actual_date > expected_date:
                        delay_days = (actual_date - expected_date).days

        if delay_days >= self.cfg.DELAY_CRIT_DAYS:
            delay_risk_score = 95.0
            msg = f"{delay_days}-day delay past scheduled completion date"
            reasons.append(msg)
            alerts_to_generate.append({
                "alert_type": "CRITICAL_DELAY",
                "severity": "CRITICAL",
                "title": "Critical Project Delay",
                "description": msg
            })
        elif delay_days >= self.cfg.DELAY_WARN_DAYS:
            delay_risk_score = 65.0
            msg = f"{delay_days}-day delay past scheduled completion date"
            reasons.append(msg)
            alerts_to_generate.append({
                "alert_type": "CRITICAL_DELAY",
                "severity": "HIGH",
                "title": "Moderate Project Delay",
                "description": msg
            })
        elif delay_days > 15:
            delay_risk_score = 30.0

        # 4. Suspicious Payment Spike Rule
        # E.g. >60% funds released while physical progress is less than 30%
        payment_risk_score = 0.0
        if financial_prog >= 60.0 and physical_prog <= 30.0:
            payment_risk_score = 85.0
            msg = f"Disproportionate fund release pattern ({financial_prog:.1f}% funds expended with only {physical_prog:.1f}% physical work)"
            reasons.append(msg)
            alerts_to_generate.append({
                "alert_type": "PAYMENT_SPIKE",
                "severity": "HIGH",
                "title": "Unusual Payment Pace",
                "description": msg
            })
        elif financial_prog >= 85.0 and physical_prog <= 50.0:
            payment_risk_score = 95.0
            msg = f"Critical fund depletion ({financial_prog:.1f}% funds expended with {physical_prog:.1f}% physical completion)"
            reasons.append(msg)
            alerts_to_generate.append({
                "alert_type": "PAYMENT_SPIKE",
                "severity": "CRITICAL",
                "title": "Critical Fund Depletion with Low Progress",
                "description": msg
            })

        # 5. Geographic Concentration Check (if all_projects is provided)
        geo_risk_score = 0.0
        if all_projects:
            same_loc_count = 0
            cur_lat = project_dict.get("latitude")
            cur_lon = project_dict.get("longitude")
            cur_id = project_dict.get("project_id")
            
            if cur_lat is not None and cur_lon is not None:
                for other in all_projects:
                    if other.get("project_id") == cur_id:
                        continue
                    o_lat = other.get("latitude")
                    o_lon = other.get("longitude")
                    if o_lat is not None and o_lon is not None:
                        # rough bounding box ~ 500m
                        if abs(cur_lat - o_lat) < 0.005 and abs(cur_lon - o_lon) < 0.005:
                            same_loc_count += 1
                
                if same_loc_count >= 3:
                    geo_risk_score = 70.0
                    msg = f"High spatial density: {same_loc_count} other projects clustered within 500m"
                    reasons.append(msg)
                    alerts_to_generate.append({
                        "alert_type": "GEO_CLUSTER",
                        "severity": "MEDIUM",
                        "title": "Geographic Cluster Anomaly",
                        "description": msg
                    })

        return {
            "cost_risk_score": cost_risk_score,
            "progress_gap_risk_score": progress_gap_risk_score,
            "delay_risk_score": delay_risk_score,
            "payment_risk_score": payment_risk_score,
            "geo_risk_score": geo_risk_score,
            "cost_escalation_pct": cost_escalation_pct,
            "progress_gap_pct": progress_gap,
            "delay_days": delay_days,
            "reasons": reasons,
            "alerts": alerts_to_generate
        }
