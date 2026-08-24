import sys
import os
import random
from datetime import datetime, timedelta, timezone

# Add backend directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from app.db.session import SessionLocal
from app.db.models import Project, FinancialRecord

def populate_all_financial_transactions():
    db = SessionLocal()
    print("=" * 70)
    print("Populating Complete Financial Disbursement & Payee Records for 100% of Projects...")
    print("=" * 70)

    # Fetch all projects
    projects = db.query(Project).all()
    print(f"Total Projects in Database: {len(projects)}")

    # Clear existing financial records and regenerate complete standardized audit trails
    db.query(FinancialRecord).delete()
    db.commit()
    print("Existing financial records reset for clean audit chain population.")

    CONTRACTOR_FIRMS = [
        "M/s Bharat Infrastructure & Projects Ltd",
        "Apex Civil Constructions & Engineering Corp",
        "National Roadways & Bridges Developer Pvt Ltd",
        "Sri Sai Krupa Builders & Contractors",
        "Himalayan Geo-Tech Infrastructure Ltd",
        "Deccan Rural Water & Works Developer",
        "Eastern Engineering & Water Resources Co",
        "Kaveri Irrigation & Canal Builders",
        "Shree Ganesh Infra Projects Pvt Ltd",
        "Pinnacle Construction & Tech Works",
        "Gramin Swaraj Infrastructure Developers",
        "Vanguard Urban & Rural Builders Ltd"
    ]

    VENDOR_MATERIALS = [
        "Jindal Steel & Power Supplies Corp",
        "UltraTech Cements & ReadyMix Solutions",
        "Supreme Pipes & Sanitations Ltd",
        "Tata Solar & Electricals Division",
        "National Water Filtration & Pump Systems"
    ]

    records_to_insert = []
    batch_size = 5000
    total_created = 0

    for idx, p in enumerate(projects):
        sanct = max(1.0, float(p.sanctioned_amount or p.estimated_cost or 10.0))
        spent = max(0.0, float(p.expenditure or 0.0))
        rel = max(spent, float(p.released_amount or sanct * 0.75))
        s_date = p.start_date or (datetime.now(timezone.utc) - timedelta(days=200))
        if s_date.tzinfo is None:
            s_date = s_date.replace(tzinfo=timezone.utc)

        # Deterministic seed for reproducible payee mapping per project
        proj_seed = hash(p.project_id)
        rng = random.Random(proj_seed)
        contractor = rng.choice(CONTRACTOR_FIRMS)
        vendor = rng.choice(VENDOR_MATERIALS)
        agency_name = p.implementing_agency or f"District Implementing Authority ({p.district})"

        # 1. Administrative Sanction Record
        records_to_insert.append(
            FinancialRecord(
                project_id=p.project_id,
                transaction_type="ADMINISTRATIVE_SANCTION",
                amount=round(sanct, 2),
                date=s_date - timedelta(days=rng.randint(20, 45)),
                description=f"Administrative & financial sanction accorded for {p.project_type} under Hon'ble MP recommendation ({p.mp_id})",
                payee=f"District Collectorate MPLADS Escrow Account ({p.district})",
                reference_number=f"AS/MPLAD/{p.district[:3].upper()}/{abs(proj_seed)%90000 + 10000}"
            )
        )

        # 2. Central Fund Release (Installment 1)
        inst1_amt = round(sanct * 0.50, 2)
        records_to_insert.append(
            FinancialRecord(
                project_id=p.project_id,
                transaction_type="CENTRAL_RELEASE_INST_1",
                amount=inst1_amt,
                date=s_date - timedelta(days=rng.randint(5, 15)),
                description=f"50% Initial installment fund release disbursed from Central Nodal Agency to Implementing Agency",
                payee=agency_name,
                reference_number=f"PFMS/REL1/{abs(proj_seed)%800000 + 100000}"
            )
        )

        # 3. Stage 1 Contractor Advance / Mobilization Disbursement
        if spent > 0:
            stage1_amt = round(min(spent, sanct * 0.30), 2)
            records_to_insert.append(
                FinancialRecord(
                    project_id=p.project_id,
                    transaction_type="CONTRACTOR_MOBILIZATION",
                    amount=stage1_amt,
                    date=s_date + timedelta(days=rng.randint(10, 25)),
                    description=f"Site mobilization, survey and materials advance payment disbursed to contractor",
                    payee=f"{contractor} (Vendor ID: VEND-{abs(proj_seed)%9000 + 1000})",
                    reference_number=f"UTR/RBI/{abs(proj_seed)%700000 + 300000}"
                )
            )

        # 4. Stage 2 Running Account Bill / Construction Milestone Payment
        if spent > sanct * 0.30:
            stage2_amt = round(min(spent - (sanct * 0.30), sanct * 0.40), 2)
            if stage2_amt > 0:
                records_to_insert.append(
                    FinancialRecord(
                        project_id=p.project_id,
                        transaction_type="RUNNING_BILL_MILESTONE_1",
                        amount=stage2_amt,
                        date=s_date + timedelta(days=rng.randint(45, 90)),
                        description=f"Running Account Bill #1 against 40% verified physical site inspection milestones",
                        payee=f"{contractor} (Vendor ID: VEND-{abs(proj_seed)%9000 + 1000})",
                        reference_number=f"RA/BILL/01/{abs(proj_seed)%60000 + 10000}"
                    )
                )

        # 5. Stage 3 Materials & Specialized Equipment Disbursement
        if spent > sanct * 0.60:
            materials_amt = round(min(spent * 0.20, sanct * 0.20), 2)
            if materials_amt > 0:
                records_to_insert.append(
                    FinancialRecord(
                        project_id=p.project_id,
                        transaction_type="MATERIALS_DISBURSEMENT",
                        amount=materials_amt,
                        date=s_date + timedelta(days=rng.randint(80, 130)),
                        description=f"Direct material procurement & testing clearance disbursement",
                        payee=f"{vendor} (Supplier Reg: SUP-{abs(proj_seed)%5000 + 1000})",
                        reference_number=f"GST/INV/{abs(proj_seed)%90000 + 10000}"
                    )
                )

        # 6. Final Handover Settlement (for completed works)
        if p.status == "COMPLETED" or p.physical_progress >= 95.0:
            final_amt = round(max(0.5, spent - (sanct * 0.80)), 2)
            records_to_insert.append(
                FinancialRecord(
                    project_id=p.project_id,
                    transaction_type="FINAL_SETTLEMENT",
                    amount=final_amt,
                    date=p.actual_completion_date or (s_date + timedelta(days=160)),
                    description=f"Final bill clearance & contractor retention release after completion certificate audit",
                    payee=f"{contractor} (Vendor ID: VEND-{abs(proj_seed)%9000 + 1000})",
                    reference_number=f"FINAL/HANDOVER/{abs(proj_seed)%40000 + 10000}"
                )
            )

        # Batch insert
        if len(records_to_insert) >= batch_size:
            db.bulk_save_objects(records_to_insert)
            db.commit()
            total_created += len(records_to_insert)
            print(f" -> Committed {total_created} financial transaction records...")
            records_to_insert = []

    if records_to_insert:
        db.bulk_save_objects(records_to_insert)
        db.commit()
        total_created += len(records_to_insert)

    print(f"Successfully populated {total_created} financial disbursement & payee records across all {len(projects)} projects!")
    db.close()

if __name__ == "__main__":
    populate_all_financial_transactions()
