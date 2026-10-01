from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select

from app.database import get_session
from app.models import User
from app.schemas import LoginRequest, TokenResponse
from app.security import create_access_token, verify_password


router = APIRouter(
    tags=["Auth"]
)


@router.post(
    "/login",
    response_model=TokenResponse
)
def login(
    login_data: LoginRequest,
    session: Session = Depends(get_session)
):
    user = session.exec(
        select(User).where(
            User.email == login_data.email
        )
    ).first()

    if not user:
        raise HTTPException(
            status_code=401,
            detail="Correo o contraseña incorrectos"
        )

    password_valid = verify_password(
        login_data.password,
        user.password_hash
    )

    if not password_valid:
        raise HTTPException(
            status_code=401,
            detail="Correo o contraseña incorrectos"
        )

    access_token = create_access_token(
        user.id
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user_id": user.id
    }