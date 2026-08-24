from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.db.models import User, UserRole
from app.core.security import verify_password, get_password_hash, create_access_token
from app.core.auth import get_current_user
from app.schemas.auth import Token, UserLogin, UserCreate, UserOut, PrototypeLogin

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/login", response_model=Token)
def login(login_data: UserLogin, db: Session = Depends(get_db)):
    clean_email = login_data.email.strip().lower()
    user = db.query(User).filter(User.email == clean_email).first()
    
    # In prototype mode, allow login with any email
    if not user:
        name_prefix = clean_email.split('@')[0].replace('.', ' ').replace('_', ' ').title()
        user = User(
            email=clean_email,
            hashed_password=get_password_hash(login_data.password or "Password@123"),
            full_name=f"{name_prefix} (Investigator)",
            role="INVESTIGATOR",
            is_active=True
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    elif login_data.password and not verify_password(login_data.password, user.hashed_password):
        # In prototype mode, if password didn't match, update hash so user isn't locked out
        user.hashed_password = get_password_hash(login_data.password)
        db.commit()
        db.refresh(user)

    access_token = create_access_token(subject=user.id, role=user.role)
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": user.role,
        "user_id": user.id,
        "full_name": user.full_name,
        "email": user.email
    }


@router.post("/prototype-login", response_model=Token)
def prototype_login(payload: PrototypeLogin, db: Session = Depends(get_db)):
    """
    Accepts any email address and role for flexible prototype evaluation.
    Auto-provisions or updates the user profile on-the-fly.
    """
    clean_email = payload.email.strip().lower()
    if not clean_email or "@" not in clean_email:
        clean_email = f"{clean_email or 'officer'}@mplads.gov.in"
    
    target_role = (payload.role or "INVESTIGATOR").upper()
    if target_role not in ["ADMIN", "ANALYST", "INVESTIGATOR", "VIEWER"]:
        target_role = "INVESTIGATOR"

    user = db.query(User).filter(User.email == clean_email).first()
    
    default_name = payload.full_name
    if not default_name:
        prefix = clean_email.split('@')[0].replace('.', ' ').replace('_', ' ').title()
        role_label = target_role.capitalize()
        default_name = f"{prefix} ({role_label})"

    if not user:
        user = User(
            email=clean_email,
            hashed_password=get_password_hash(payload.password or "Prototype@123"),
            full_name=default_name,
            role=target_role,
            is_active=True
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    else:
        # Update user's active role and name for this prototype session
        user.role = target_role
        if payload.full_name:
            user.full_name = payload.full_name
        db.commit()
        db.refresh(user)

    access_token = create_access_token(subject=user.id, role=user.role)
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": user.role,
        "user_id": user.id,
        "full_name": user.full_name,
        "email": user.email
    }


@router.post("/demo-login/{role}", response_model=Token)
def demo_quick_login(role: str, db: Session = Depends(get_db)):
    """
    Convenient one-click login for demoing SIH evaluator roles
    (ADMIN, ANALYST, INVESTIGATOR, VIEWER).
    """
    role_upper = role.upper()
    user = db.query(User).filter(User.role == role_upper).first()
    if not user:
        # Create on demand if not present
        user = User(
            email=f"{role_upper.lower()}@mplads.gov.in",
            hashed_password=get_password_hash(f"{role_upper.capitalize()}@123"),
            full_name=f"Demo {role_upper.capitalize()} Officer",
            role=role_upper,
            is_active=True
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    access_token = create_access_token(subject=user.id, role=user.role)
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": user.role,
        "user_id": user.id,
        "full_name": user.full_name,
        "email": user.email
    }


@router.get("/me", response_model=UserOut)
def read_current_user(current_user: User = Depends(get_current_user)):
    return current_user
