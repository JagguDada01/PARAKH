from fastapi import APIRouter, Depends, UploadFile, File, Response, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.schemas.ingestion import IngestionSummaryOut
from app.services.ingestion_service import IngestionService
from app.services.synthetic_generator import generate_synthetic_data

router = APIRouter(prefix="/ingestion", tags=["Data Ingestion"])


@router.post("/upload", response_model=IngestionSummaryOut)
async def upload_dataset(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    contents = await file.read()
    service = IngestionService(db=db)
    summary = service.process_file(file_bytes=contents, filename=file.filename or "upload.csv")
    return summary


@router.post("/reset-demo")
def reset_demo_data(db: Session = Depends(get_db)):
    result = generate_synthetic_data(db=db, num_projects=140)
    return {
        "status": "SUCCESS",
        "message": "Demo synthetic MPLADS dataset successfully refreshed with deliberate anomaly test scenarios.",
        "stats": result
    }


@router.get("/sample-csv")
def download_sample_csv():
    csv_content = (
        "project_id,state,district,constituency,project_type,description,latitude,longitude,estimated_cost,sanctioned_amount,released_amount,expenditure,start_date,expected_completion_date,physical_progress,financial_progress,implementing_agency,status\n"
        "MPLAD-EX-001,Maharashtra,Pune,Pune City,Drinking Water & Tube Wells,Deep Community Tube Well with Solar Pump at Ward 5,18.5204,73.8567,25 Lakhs,25.0,20.0,18.5,2024-01-15,2024-08-30,75.0,74.0,Public Works Department (PWD) - Maharashtra,IN_PROGRESS\n"
        "MPLAD-EX-002,Manipur,Imphal West,Inner Manipur,Community Halls & Centres,Construction of Multipurpose Community Hall,24.8170,93.9368,45 Lakhs,45.0,36.0,34.0,2024-02-01,2024-10-15,60.0,75.5,Rural Development Agency (DRDA) - Manipur,IN_PROGRESS\n"
        "MPLAD-EX-003,Karnataka,Bengaluru Urban,Bangalore South,Solar Street Lighting,50 Solar Street Light Installations across Block 4,12.9249,77.5838,30.0,30.0,25.0,38.5,2023-11-01,2024-05-30,45.0,100.0,Municipal Infrastructure Corporation - Karnataka,IN_PROGRESS\n"
    )
    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=mplads_sample_template.csv"}
    )
