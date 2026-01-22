import os
from datetime import datetime, timedelta, timezone
from typing import Optional

import jwt
from jwt import InvalidTokenError

from fastapi import Depends, HTTPException, Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse

JWT_ALGORITHM = "HS256"
JWT_ISSUER = "open-notebook"
JWT_AUDIENCE = "open-notebook-users"


def get_jwt_secret() -> Optional[str]:
    return os.environ.get("OPEN_NOTEBOOK_JWT_SECRET")


def is_password_auth_enabled() -> bool:
    return bool(
        os.environ.get("OPEN_NOTEBOOK_PASSWORD")
        or (
            os.environ.get("OPEN_NOTEBOOK_ADMIN_EMAIL")
            and os.environ.get("OPEN_NOTEBOOK_ADMIN_PASSWORD")
        )
    )


def is_google_auth_enabled() -> bool:
    return bool(
        os.environ.get("OPEN_NOTEBOOK_GOOGLE_CLIENT_ID")
        and os.environ.get("OPEN_NOTEBOOK_GOOGLE_CLIENT_SECRET")
        and os.environ.get("OPEN_NOTEBOOK_GOOGLE_REDIRECT_URI")
    )


def is_auth_enabled() -> bool:
    return is_password_auth_enabled() or is_google_auth_enabled()


def create_access_token(email: str, provider: str) -> str:
    jwt_secret = get_jwt_secret()
    if not jwt_secret:
        raise HTTPException(status_code=500, detail="JWT secret is not configured")

    expires_minutes = int(os.environ.get("OPEN_NOTEBOOK_JWT_EXPIRES_MINUTES", "10080"))
    now = datetime.now(tz=timezone.utc)
    payload = {
        "sub": email,
        "provider": provider,
        "iss": JWT_ISSUER,
        "aud": JWT_AUDIENCE,
        "iat": int(now.timestamp()),
        "exp": int((now + timedelta(minutes=expires_minutes)).timestamp()),
    }
    return jwt.encode(payload, jwt_secret, algorithm=JWT_ALGORITHM)


def verify_access_token(token: str) -> bool:
    jwt_secret = get_jwt_secret()
    if not jwt_secret:
        return False
    try:
        jwt.decode(
            token,
            jwt_secret,
            algorithms=[JWT_ALGORITHM],
            audience=JWT_AUDIENCE,
            issuer=JWT_ISSUER,
        )
    except InvalidTokenError:
        return False
    return True


class PasswordAuthMiddleware(BaseHTTPMiddleware):
    """
    Middleware to check password authentication for all API requests.
    Supports legacy password authentication and JWT bearer tokens.
    """

    def __init__(self, app, excluded_paths: Optional[list] = None):
        super().__init__(app)
        self.password = os.environ.get("OPEN_NOTEBOOK_PASSWORD")
        self.excluded_paths = excluded_paths or [
            "/",
            "/health",
            "/docs",
            "/openapi.json",
            "/redoc",
        ]

    async def dispatch(self, request: Request, call_next):
        # Skip authentication if auth is not configured
        if not is_auth_enabled():
            return await call_next(request)

        # Skip authentication for excluded paths
        if request.url.path in self.excluded_paths:
            return await call_next(request)

        # Skip authentication for CORS preflight requests (OPTIONS)
        if request.method == "OPTIONS":
            return await call_next(request)

        # Check authorization header
        auth_header = request.headers.get("Authorization")

        if not auth_header:
            return JSONResponse(
                status_code=401,
                content={"detail": "Missing authorization header"},
                headers={"WWW-Authenticate": "Bearer"},
            )

        # Expected format: "Bearer {password}"
        try:
            scheme, credentials = auth_header.split(" ", 1)
            if scheme.lower() != "bearer":
                raise ValueError("Invalid authentication scheme")
        except ValueError:
            return JSONResponse(
                status_code=401,
                content={"detail": "Invalid authorization header format"},
                headers={"WWW-Authenticate": "Bearer"},
            )

        # Check legacy password
        if self.password and credentials == self.password:
            return await call_next(request)

        # Check JWT token
        if verify_access_token(credentials):
            return await call_next(request)

        return JSONResponse(
            status_code=401,
            content={"detail": "Invalid credentials"},
            headers={"WWW-Authenticate": "Bearer"},
        )


# Optional: HTTPBearer security scheme for OpenAPI documentation
security = HTTPBearer(auto_error=False)


def check_api_password(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
) -> bool:
    """
    Utility function to check API password.
    Can be used as a dependency in individual routes if needed.
    """
    password = os.environ.get("OPEN_NOTEBOOK_PASSWORD")

    # No auth set, allow access
    if not is_auth_enabled():
        return True

    # No credentials provided
    if not credentials:
        raise HTTPException(
            status_code=401,
            detail="Missing authorization",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Check password
    if password and credentials.credentials == password:
        return True

    # Check JWT token
    if verify_access_token(credentials.credentials):
        return True

    raise HTTPException(
        status_code=401,
        detail="Invalid credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    return True
