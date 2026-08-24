from datetime import datetime, timezone
from typing import List, Dict, Any, Tuple
import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
from app.core.config import settings


class UnsupervisedAnomalyEngine:
    """
    Isolation Forest anomaly detector trained on multidimensional engineered
    numerical & ratio features across MPLADS projects.
    """

    FEATURE_NAMES = [
        "cost_escalation_ratio",
        "progress_mismatch",
        "delay_days",
        "planned_duration_days",
        "expenditure_per_percent_physical",
        "financial_progress",
        "physical_progress",
        "expenditure_lakhs"
    ]

    def __init__(self, contamination: float = None):
        self.contamination = contamination or settings.ISOLATION_FOREST_CONTAMINATION
        self.scaler = StandardScaler()
        self.model = IsolationForest(
            contamination=self.contamination,
            random_state=42,
            n_estimators=100,
            n_jobs=-1
        )
        self.is_fitted = False

    def extract_features(self, projects: List[Dict[str, Any]]) -> pd.DataFrame:
        now = datetime.now(timezone.utc)
        rows = []
        
        for p in projects:
            est = float(p.get("estimated_cost", 0.0) or 0.0)
            sanc = float(p.get("sanctioned_amount", 0.0) or 0.0)
            exp = float(p.get("expenditure", 0.0) or 0.0)
            phys = float(p.get("physical_progress", 0.0) or 0.0)
            fin = float(p.get("financial_progress", 0.0) or 0.0)
            
            baseline = sanc if sanc > 0 else (est if est > 0 else 1.0)
            cost_esc_ratio = exp / baseline
            progress_mismatch = fin - phys
            
            start_date = p.get("start_date")
            exp_date = p.get("expected_completion_date")
            
            if isinstance(start_date, str):
                try:
                    start_date = datetime.fromisoformat(start_date.replace("Z", "+00:00"))
                except Exception:
                    start_date = now
            if isinstance(exp_date, str):
                try:
                    exp_date = datetime.fromisoformat(exp_date.replace("Z", "+00:00"))
                except Exception:
                    exp_date = now

            if start_date and start_date.tzinfo is None:
                start_date = start_date.replace(tzinfo=timezone.utc)
            if exp_date and exp_date.tzinfo is None:
                exp_date = exp_date.replace(tzinfo=timezone.utc)

            planned_duration = max(30, (exp_date - start_date).days if exp_date and start_date else 180)
            
            delay = 0
            if exp_date and p.get("status") != "COMPLETED" and phys < 100.0:
                if now > exp_date:
                    delay = max(0, (now - exp_date).days)
            
            exp_per_phys = exp / max(1.0, phys)

            rows.append({
                "cost_escalation_ratio": cost_esc_ratio,
                "progress_mismatch": progress_mismatch,
                "delay_days": delay,
                "planned_duration_days": planned_duration,
                "expenditure_per_percent_physical": exp_per_phys,
                "financial_progress": fin,
                "physical_progress": phys,
                "expenditure_lakhs": exp
            })

        df = pd.DataFrame(rows)
        # Handle nulls / infinities
        df = df.replace([np.inf, -np.inf], np.nan).fillna(0.0)
        return df

    def fit_predict(self, projects: List[Dict[str, Any]]) -> Tuple[List[float], List[int]]:
        """
        Fits Isolation Forest and predicts anomaly scores (0 to 100) and outlier flags (1 = outlier, 0 = inlier).
        """
        if not projects or len(projects) < 5:
            # Fallback if too few samples
            return [0.0] * len(projects), [0] * len(projects)

        df = self.extract_features(projects)
        X = self.scaler.fit_transform(df[self.FEATURE_NAMES])
        self.model.fit(X)
        self.is_fitted = True

        # raw decision function: negative values indicate outliers, positive indicate normal
        raw_scores = self.model.decision_function(X)
        preds = self.model.predict(X)  # -1 for anomaly, 1 for inlier

        # Normalize decision function score into a 0-100 anomaly risk index
        # Min raw score is most anomalous, max raw score is most normal
        min_s, max_s = raw_scores.min(), raw_scores.max()
        if max_s > min_s:
            norm_anomaly_scores = ((max_s - raw_scores) / (max_s - min_s)) * 100.0
        else:
            norm_anomaly_scores = np.zeros(len(raw_scores))

        outlier_flags = [1 if p == -1 else 0 for p in preds]
        return norm_anomaly_scores.tolist(), outlier_flags
