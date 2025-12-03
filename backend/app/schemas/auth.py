from pydantic import BaseModel, Field


class LoginRequest(BaseModel):
    """Request body for login endpoint"""
    address: str = Field(..., description="Stacks principal address (SP... or ST...)")

    class Config:
        json_schema_extra = {
            "example": {
                "address": "SP2ABC123XYZ456..."
            }
        }


class LoginResponse(BaseModel):
    """Response from login endpoint"""
    token: str = Field(..., description="JWT session token")
    token_type: str = Field(default="bearer", description="Token type")
    expires_in: int = Field(..., description="Token expiry in seconds")
    address: str = Field(..., description="Authenticated Stacks address")

    class Config:
        json_schema_extra = {
            "example": {
                "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                "token_type": "bearer",
                "expires_in": 604800,
                "address": "SP2ABC123XYZ456..."
            }
        }


class UserInfo(BaseModel):
    """Current user information"""
    address: str = Field(..., description="Stacks principal address")

    class Config:
        json_schema_extra = {
            "example": {
                "address": "SP2ABC123XYZ456..."
            }
        }