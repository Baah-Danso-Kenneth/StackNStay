from fastapi import APIRouter, UploadFile, File, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import httpx
import json
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

router = APIRouter(prefix="/ipfs", tags=["IPFS"])

# Pinata API configuration
PINATA_API_KEY = os.getenv("PINATA_API_KEY", "")
PINATA_SECRET_KEY = os.getenv("PINATA_SECRET_KEY", "")
PINATA_JWT = os.getenv("PINATA_JWT", "")

# Pinata endpoints
PINATA_PIN_FILE_URL = "https://api.pinata.cloud/pinning/pinFileToIPFS"
PINATA_PIN_JSON_URL = "https://api.pinata.cloud/pinning/pinJSONToIPFS"


class ListingMetadata(BaseModel):
    """Property listing metadata structure"""
    title: str
    description: str
    location: str
    images: List[str]  # IPFS URLs
    amenities: List[str]
    maxGuests: int
    bedrooms: int
    bathrooms: int


class IPFSUploadResponse(BaseModel):
    """Response for IPFS uploads"""
    ipfsHash: str
    ipfsUrl: str


@router.post("/upload-image", response_model=IPFSUploadResponse)
async def upload_image_to_ipfs(file: UploadFile = File(...)):
    """
    Upload a single image to IPFS via Pinata.
    
    Returns the IPFS hash and URL.
    """
    try:
        # Validate file type
        if not file.content_type or not file.content_type.startswith("image/"):
            raise HTTPException(status_code=400, detail="File must be an image")
        
        # Check if Pinata credentials are configured
        print(f"DEBUG: PINATA_JWT set: {bool(PINATA_JWT)}")
        print(f"DEBUG: PINATA_API_KEY set: {bool(PINATA_API_KEY)}")
        
        if not PINATA_JWT and not (PINATA_API_KEY and PINATA_SECRET_KEY):
            print("ERROR: Pinata credentials missing")
            raise HTTPException(
                status_code=500,
                detail="IPFS service not configured. Please set PINATA_JWT or PINATA_API_KEY/PINATA_SECRET_KEY in environment variables"
            )
        
        # Read file content
        file_content = await file.read()
        
        # Prepare headers
        headers = {}
        if PINATA_JWT:
            headers["Authorization"] = f"Bearer {PINATA_JWT}"
        else:
            headers["pinata_api_key"] = PINATA_API_KEY
            headers["pinata_secret_api_key"] = PINATA_SECRET_KEY
        
        # Prepare file for upload
        files = {
            "file": (file.filename, file_content, file.content_type)
        }
        
        # Optional: Add metadata
        pinata_metadata = {
            "name": file.filename,
            "keyvalues": {
                "type": "property_image",
                "uploaded_by": "stacknstay"
            }
        }
        
        data = {
            "pinataMetadata": json.dumps(pinata_metadata),
            "pinataOptions": json.dumps({"cidVersion": 1})
        }
        
        # Upload to Pinata
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                PINATA_PIN_FILE_URL,
                headers=headers,
                files=files,
                data=data
            )
        
        if response.status_code != 200:
            error_detail = response.text
            raise HTTPException(
                status_code=response.status_code,
                detail=f"Failed to upload to IPFS: {error_detail}"
            )
        
        result = response.json()
        ipfs_hash = result["IpfsHash"]
        
        return IPFSUploadResponse(
            ipfsHash=ipfs_hash,
            ipfsUrl=f"ipfs://{ipfs_hash}"
        )
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"ERROR: Exception in upload_image_to_ipfs: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error uploading image: {str(e)}")


@router.post("/upload", response_model=IPFSUploadResponse)
async def upload_metadata_to_ipfs(metadata: ListingMetadata):
    """
    Upload property metadata JSON to IPFS via Pinata.
    
    Returns the IPFS hash that should be stored in the smart contract.
    """
    try:
        # Check if Pinata credentials are configured
        if not PINATA_JWT and not (PINATA_API_KEY and PINATA_SECRET_KEY):
            raise HTTPException(
                status_code=500,
                detail="IPFS service not configured. Please set PINATA_JWT or PINATA_API_KEY/PINATA_SECRET_KEY in environment variables"
            )
        
        # Prepare headers
        headers = {
            "Content-Type": "application/json"
        }
        if PINATA_JWT:
            headers["Authorization"] = f"Bearer {PINATA_JWT}"
        else:
            headers["pinata_api_key"] = PINATA_API_KEY
            headers["pinata_secret_api_key"] = PINATA_SECRET_KEY
        
        # Prepare JSON payload
        pinata_body = {
            "pinataContent": metadata.dict(),
            "pinataMetadata": {
                "name": f"property_{metadata.title.replace(' ', '_')}",
                "keyvalues": {
                    "type": "property_metadata",
                    "location": metadata.location,
                    "uploaded_by": "stacknstay"
                }
            },
            "pinataOptions": {
                "cidVersion": 1
            }
        }
        
        # Upload to Pinata
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                PINATA_PIN_JSON_URL,
                headers=headers,
                json=pinata_body
            )
        
        if response.status_code != 200:
            error_detail = response.text
            raise HTTPException(
                status_code=response.status_code,
                detail=f"Failed to upload metadata to IPFS: {error_detail}"
            )
        
        result = response.json()
        ipfs_hash = result["IpfsHash"]
        
        return IPFSUploadResponse(
            ipfsHash=ipfs_hash,
            ipfsUrl=f"ipfs://{ipfs_hash}"
        )
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error uploading metadata: {str(e)}")


@router.get("/retrieve/{ipfs_hash}")
async def retrieve_from_ipfs(ipfs_hash: str):
    """
    Retrieve content from IPFS via Pinata gateway.
    
    This is a helper endpoint for testing/debugging.
    """
    try:
        gateway_url = f"https://gateway.pinata.cloud/ipfs/{ipfs_hash}"
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(gateway_url)
        
        if response.status_code != 200:
            raise HTTPException(
                status_code=response.status_code,
                detail="Failed to retrieve from IPFS"
            )
        
        # Try to parse as JSON, otherwise return raw content
        try:
            return response.json()
        except:
            return {"content": response.text}
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving from IPFS: {str(e)}")
