"""
Authentication router for Open Notebook API.
Provides endpoints for auth status, password login, and Google OAuth.
"""

import os
from datetime import datetime, timedelta, timezone
from typing import Optional
from urllib.parse import urlencode

import httpx
import jwt
from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import RedirectResponse
from jwt import InvalidTokenError
from pydantic import BaseModel, EmailStr

from api.auth import (
    create_access_token,
    get_jwt_secret,
    is_auth_enabled,
    is_google_auth_enabled,
    is_password_auth_enabled,
)

router = APIRouter(prefix="/auth", tags=["auth"])

GOOGLE_OAUTH_SCOPE = "openid email profile"
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_JWKS_URL = "https://www.googleapis.com/oauth2/v3/certs"
OAUTH_STATE_AUDIENCE = "open-notebook-google-oauth"


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "Bearer"
    provider: str
    email: EmailStr


def _get_admin_credentials() -> Optional[tuple[str, str]]:
    email = os.environ.get("OPEN_NOTEBOOK_ADMIN_EMAIL")
    password = os.environ.get("OPEN_NOTEBOOK_ADMIN_PASSWORD")
    if email and password:
        return email, password
    return None


def _build_google_state_token() -> str:
    jwt_secret = get_jwt_secret()
    if not jwt_secret:
        raise HTTPException(status_code=500, detail="JWT secret is not configured")
    now = datetime.now(tz=timezone.utc)
    payload = {
        "aud": OAUTH_STATE_AUDIENCE,
        "iat": int(now.timestamp()),
        "exp": int((now + timedelta(minutes=10)).timestamp()),
    }
    return jwt.encode(payload, jwt_secret, algorithm="HS256")


def _verify_google_state_token(state: str) -> None:
    jwt_secret = get_jwt_secret()
    if not jwt_secret:
        raise HTTPException(status_code=500, detail="JWT secret is not configured")
    try:
        jwt.decode(
            state,
            jwt_secret,
            algorithms=["HS256"],
            audience=OAUTH_STATE_AUDIENCE,
        )
    except InvalidTokenError as exc:
        raise HTTPException(status_code=400, detail="Invalid OAuth state") from exc


async def _exchange_google_code(code: str) -> dict:
    client_id = os.environ.get("OPEN_NOTEBOOK_GOOGLE_CLIENT_ID")
    client_secret = os.environ.get("OPEN_NOTEBOOK_GOOGLE_CLIENT_SECRET")
    redirect_uri = os.environ.get("OPEN_NOTEBOOK_GOOGLE_REDIRECT_URI")
    if not client_id or not client_secret or not redirect_uri:
        raise HTTPException(status_code=500, detail="Google OAuth is not configured")

    payload = {
        "code": code,
        "client_id": client_id,
        "client_secret": client_secret,
        "redirect_uri": redirect_uri,
        "grant_type": "authorization_code",
    }

    async with httpx.AsyncClient(timeout=10) as client:
        response = await client.post(GOOGLE_TOKEN_URL, data=payload)
    if response.status_code != 200:
        raise HTTPException(
            status_code=400, detail="Failed to exchange Google authorization code"
        )
    return response.json()


def _verify_google_id_token(id_token: str) -> dict:
    client_id = os.environ.get("OPEN_NOTEBOOK_GOOGLE_CLIENT_ID")
    if not client_id:
        raise HTTPException(status_code=500, detail="Google OAuth is not configured")

    jwk_client = jwt.PyJWKClient(GOOGLE_JWKS_URL)
    signing_key = jwk_client.get_signing_key_from_jwt(id_token)
    try:
        payload = jwt.decode(
            id_token,
            signing_key.key,
            algorithms=["RS256"],
            audience=client_id,
            issuer=["accounts.google.com", "https://accounts.google.com"],
        )
    except InvalidTokenError as exc:
        raise HTTPException(status_code=401, detail="Invalid Google ID token") from exc
    return payload


def _is_allowed_google_email(email: str) -> bool:
    allowed_domains = os.environ.get("OPEN_NOTEBOOK_GOOGLE_ALLOWED_DOMAINS")
    allowed_emails = os.environ.get("OPEN_NOTEBOOK_GOOGLE_ALLOWED_EMAILS")

    if allowed_emails:
        email_list = {item.strip().lower() for item in allowed_emails.split(",") if item.strip()}
        if email.lower() not in email_list:
            return False

    if allowed_domains:
        domains = {item.strip().lower() for item in allowed_domains.split(",") if item.strip()}
        domain = email.split("@")[-1].lower()
        if domain not in domains:
            return False

    return True


@router.get("/status")
async def get_auth_status():
    """
    Check if authentication is enabled.
    Returns available authentication providers.
    """
    return {
        "auth_enabled": is_auth_enabled(),
        "password_auth_enabled": is_password_auth_enabled(),
        "google_auth_enabled": is_google_auth_enabled(),
        "message": "Authentication is required"
        if is_auth_enabled()
        else "Authentication is disabled",
    }


@router.post("/login", response_model=LoginResponse)
async def login(request: LoginRequest):
    if not is_password_auth_enabled():
        raise HTTPException(status_code=400, detail="Password authentication is disabled")

    admin_credentials = _get_admin_credentials()
    if admin_credentials:
        admin_email, admin_password = admin_credentials
        if request.email.lower() != admin_email.lower() or request.password != admin_password:
            raise HTTPException(status_code=401, detail="Invalid email or password")
        access_token = create_access_token(request.email, "password")
        return LoginResponse(
            access_token=access_token,
            provider="password",
            email=request.email,
        )

    legacy_password = os.environ.get("OPEN_NOTEBOOK_PASSWORD")
    if legacy_password and request.password == legacy_password:
        jwt_secret = get_jwt_secret()
        access_token = (
            create_access_token(request.email, "password")
            if jwt_secret
            else legacy_password
        )
        return LoginResponse(
            access_token=access_token,
            provider="password",
            email=request.email,
        )

    raise HTTPException(status_code=401, detail="Invalid email or password")


@router.get("/google")
async def google_oauth_start():
    if not is_google_auth_enabled():
        raise HTTPException(status_code=400, detail="Google OAuth is disabled")

    client_id = os.environ.get("OPEN_NOTEBOOK_GOOGLE_CLIENT_ID")
    redirect_uri = os.environ.get("OPEN_NOTEBOOK_GOOGLE_REDIRECT_URI")
    state = _build_google_state_token()

    params = {
        "client_id": client_id,
        "redirect_uri": redirect_uri,
        "response_type": "code",
        "scope": GOOGLE_OAUTH_SCOPE,
        "access_type": "offline",
        "prompt": "consent",
        "state": state,
    }

    return RedirectResponse(f"{GOOGLE_AUTH_URL}?{urlencode(params)}")


@router.get("/google/callback")
async def google_oauth_callback(request: Request):
    if not is_google_auth_enabled():
        raise HTTPException(status_code=400, detail="Google OAuth is disabled")

    code = request.query_params.get("code")
    state = request.query_params.get("state")

    if not code or not state:
        raise HTTPException(status_code=400, detail="Missing OAuth callback parameters")

    _verify_google_state_token(state)

    token_payload = await _exchange_google_code(code)
    id_token = token_payload.get("id_token")
    if not id_token:
        raise HTTPException(status_code=400, detail="Missing Google ID token")

    google_user = _verify_google_id_token(id_token)
    email = google_user.get("email")
    if not email:
        raise HTTPException(status_code=400, detail="Google account email not found")

    if not _is_allowed_google_email(email):
        raise HTTPException(status_code=403, detail="Google account is not authorized")

    access_token = create_access_token(email, "google")
    frontend_url = os.environ.get("OPEN_NOTEBOOK_FRONTEND_URL", "http://localhost:3000")
    redirect_url = f"{frontend_url}/login?{urlencode({'token': access_token, 'provider': 'google'})}"
    return RedirectResponse(redirect_url)
