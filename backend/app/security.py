import os

from datetime import datetime, timedelta, timezone

from dotenv import load_dotenv

from fastapi import (
    Depends,
    HTTPException,
    status
)

from fastapi.security import (
    HTTPAuthorizationCredentials,
    HTTPBearer
)

from jose import JWTError, jwt

from passlib.context import CryptContext

from sqlmodel import Session

from app.database import get_session
from app.models import User


load_dotenv()


# ==================================================
# CONFIGURACIÓN JWT
# ==================================================

SECRET_KEY = os.getenv("SECRET_KEY")

if not SECRET_KEY:
    raise RuntimeError(
        "SECRET_KEY no está configurada"
    )


ALGORITHM = os.getenv(
    "ALGORITHM",
    "HS256"
)


ACCESS_TOKEN_EXPIRE_MINUTES = int(
    os.getenv(
        "ACCESS_TOKEN_EXPIRE_MINUTES",
        "60"
    )
)


# ==================================================
# PASSWORD HASHING
# ==================================================

pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto"
)


# ==================================================
# BEARER AUTHENTICATION
# ==================================================

bearer_scheme = HTTPBearer(
    auto_error=False
)


# ==================================================
# PASSWORD
# ==================================================

def hash_password(password: str) -> str:

    return pwd_context.hash(
        password
    )


def verify_password(
    plain_password: str,
    hashed_password: str
) -> bool:

    return pwd_context.verify(
        plain_password,
        hashed_password
    )


# ==================================================
# JWT
# ==================================================

def create_access_token(
    user_id: int
) -> str:

    expire = (
        datetime.now(timezone.utc)
        + timedelta(
            minutes=ACCESS_TOKEN_EXPIRE_MINUTES
        )
    )

    payload = {
        "sub": str(user_id),
        "exp": expire
    }

    return jwt.encode(
        payload,
        SECRET_KEY,
        algorithm=ALGORITHM
    )


# ==================================================
# CURRENT USER
# ==================================================

def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(
        bearer_scheme
    ),
    session: Session = Depends(
        get_session
    )
) -> User:

    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Token inválido o expirado",
        headers={
            "WWW-Authenticate": "Bearer"
        }
    )

    if credentials is None:
        raise credentials_exception

    try:

        payload = jwt.decode(
            credentials.credentials,
            SECRET_KEY,
            algorithms=[ALGORITHM]
        )

        user_id = payload.get(
            "sub"
        )

        if user_id is None:
            raise credentials_exception

        user_id = int(user_id)

    except (
        JWTError,
        ValueError
    ):
        raise credentials_exception

    user = session.get(
        User,
        user_id
    )

    if user is None:
        raise credentials_exception

    return user