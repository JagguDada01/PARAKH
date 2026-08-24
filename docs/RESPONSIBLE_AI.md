# Responsible AI and Ethical Vigilance Framework

## 1. Core Principle: Investigative Decision Support, Not Automated Accusation
The MPLADS AI Monitoring and Vigilance Platform is designed strictly as an **investigative decision support tool for authorized human auditors**. 

In accordance with ethical AI and administrative justice standards:
- **No Automated Accusation**: The system never concludes or claims that "fraud is confirmed."
- **Standardized Vigilance Terminology**: Outputs are uniformly labeled using objective risk indicators:
  - *Potential Anomaly*
  - *Potential Irregularity*
  - *High-Risk Project*
  - *Potential Duplicate Candidate*
  - *Requires Verification*
  - *Investigation Recommended*
- **Human-in-the-Loop Protocol**: All alert transitions (e.g. marking under review, requesting field inspection, resolving, or dismissing) require authenticated officer intervention and produce immutable audit logs.

---

## 2. Demographic & Political Impartiality
To guarantee algorithmic neutrality and prevent bias:
1. **Strict Exclusion of Sensitive Attributes**:
   - Religion, caste, community, ethnicity, and gender demographics are completely absent from all database schemas and feature pipelines.
2. **Exclusion of Political and Personal Identifiers**:
   - Member of Parliament (MP) names and political party affiliations are never included as features in machine learning models or anomaly scoring rules.
   - All models operate purely on objective physical and financial parameters (sanctioned amounts, milestone dates, contractor disbursements, and verified physical inspection percentages).

---

## 3. Transparency & Model Explainability
- Every risk score (0-100) is decomposed into transparent sub-component indices (Cost Risk, Delay Risk, Progress Gap Risk, Payment Pace, Duplicate Match, and Isolation Forest Multivariate Outlier).
- The system generates plain-language, bulleted rationales (e.g., *"68% cost escalation above sanctioned amount"*, *"49% progress gap between financial release and physical completion"*) enabling auditors to verify specific evidence rather than trusting a black-box score.

---

## 4. Ground Truth & Synthetic Demonstration Labels Note
- The prototype demonstration leverages a realistic synthetic dataset designed to showcase anomaly detection capabilities across normal, delayed, escalated, progress-mismatched, and duplicate archetypes.
- In production deployment, supervised machine learning classifiers require historical ground-truth investigation audit logs from Comptroller and Auditor General (CAG) or State Vigilance audits.
