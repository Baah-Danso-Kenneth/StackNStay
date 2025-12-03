from fastapi import Depends, HTTPException, Header
from typing import Optional
from jose import jwt, JWTError
from app.core.config import settings


async def get_current_user(authorization: Optional[str] = Header(None)) -> str:
    """
    Extract and validate JWT token from Authorization header.
    Returns the Stacks principal address.

    Usage:
        @router.get("/my-stuff")
        async def my_stuff(user_address: str = Depends(get_current_user)):
            # user_address = "SP2ABC..."
    """
    if not authorization:
        raise HTTPException(
            status_code=401,
            detail="Not authenticated. Please provide Authorization header."
        )

    if not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=401,
            detail="Invalid authorization format. Use: Bearer <token>"
        )

    token = authorization.replace("Bearer ", "")

    try:
        payload = jwt.decode(
            token,
            settings.SESSION_SECRET_KEY,
            algorithms=[settings.SESSION_ALGORITHM]
        )

        stacks_address = payload.get("address")

        if not stacks_address:
            raise HTTPException(401, detail="Invalid token payload")

        return stacks_address

    except JWTError:
        raise HTTPException(401, detail="Could not validate credentials")


async def get_optional_user(authorization: Optional[str] = Header(None)) -> Optional[str]:
    """
    Optional authentication - returns address if authenticated, None otherwise.
    Useful for endpoints that work differently for logged-in users.

    Usage:
        @router.get("/properties")
        async def list_properties(user_address: Optional[str] = Depends(get_optional_user)):
            if user_address:
                # Show personalized results
            else:
                # Show public results
    """
    if not authorization:
        return None

    try:
        return await get_current_user(authorization)
    except HTTPException:
        return None