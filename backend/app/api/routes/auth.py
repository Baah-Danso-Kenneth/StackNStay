from fastapi import APIRouter, Depends, HTTPException
from datetime import datetime, timedelta
from jose import jwt

from app.core.config import settings
from app.core.dependencies import get_current_user
from app.schemas.auth import LoginRequest, LoginResponse, UserInfo

router = APIRouter(prefix="/auth", tags=["Authentication"])


def create_session_token(stacks_address: str) -> dict:
    """
    Create a JWT session token for a Stacks address.

    Returns dict with token and expiry info.
    """
    expires_delta = timedelta(hours=settings.SESSION_EXPIRE_HOURS)
    expire = datetime.utcnow() + expires_delta

    payload = {
        "address": stacks_address,
        "exp": expire,
        "iat": datetime.utcnow()
    }

    token = jwt.encode(
        payload,
        settings.SESSION_SECRET_KEY,
        algorithm=settings.SESSION_ALGORITHM
    )

    return {
        "token": token,
        "expires_in": int(expires_delta.total_seconds()),
        "expires_at": expire
    }


@router.post("/login", response_model=LoginResponse)
async def login(request: LoginRequest):
    """
    Login with Stacks wallet address.

    In production, this should verify a signature.
    For now, we trust the frontend has verified wallet ownership.

    **Flow:**
    1. Frontend: User connects Stacks wallet (Hiro/Leather/Xverse)
    2. Frontend: Gets user's address
    3. Frontend: Calls this endpoint with address
    4. Backend: Returns JWT session token
    5. Frontend: Stores token, includes in all API requests
    """

    # Basic validation
    if not request.address.startswith(("SP", "ST")):
        raise HTTPException(
            status_code=400,
            detail="Invalid Stacks address format. Must start with SP or ST."
        )

    # Create session token
    token_data = create_session_token(request.address)

    return LoginResponse(
        token=token_data["token"],
        token_type="bearer",
        expires_in=token_data["expires_in"],
        address=request.address
    )


@router.get("/me", response_model=UserInfo)
async def get_current_user_info(
        user_address: str = Depends(get_current_user)
):
    """
    Get current authenticated user information.

    Requires valid JWT token in Authorization header.
    """
    return UserInfo(address=user_address)


@router.post("/logout")
async def logout():
    """
    Logout endpoint.

    Since we use stateless JWTs, there's no server-side session to destroy.
    Frontend should delete the token from storage.

    In production, you might implement a token blacklist using Redis.
    """
    return {
        "message": "Logged out successfully. Please delete your token on the client."
    }