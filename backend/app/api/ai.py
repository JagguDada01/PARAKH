from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.schemas.ai import AIQueryRequest, AIQueryResponse
from app.services.ai_query_engine import ControlledAIQueryEngine

router = APIRouter(prefix="/ai", tags=["AI Assistant"])


@router.post("/query", response_model=AIQueryResponse)
def ask_ai_assistant(payload: AIQueryRequest, db: Session = Depends(get_db)):
    engine = ControlledAIQueryEngine(db=db)
    result = engine.process_query(
        query=payload.query,
        context_project_id=payload.context_project_id
    )
    return result
