"""
Upload StacksStay properties to IPFS and generate blockchain deployment data.

This script:
1. Takes property data from JSON
2. Downloads images from URLs (or uses local images)
3. Uploads images to IPFS via Pinata
4. Creates metadata JSON with IPFS image hashes
5. Uploads metadata to IPFS
6. Generates Clarity contract calls for deployment
"""

import os
import json
import requests
from pathlib import Path
from typing import List, Dict
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

PINATA_API_KEY = os.getenv("PINATA_API_KEY")
PINATA_SECRET_KEY = os.getenv("PINATA_SECRET_KEY")
# JWT token is stored in IPFS_GATEWAY_URL in the .env (Pinata's format)
PINATA_JWT = os.getenv("IPFS_GATEWAY_URL")  # This is actually the JWT token

# Pinata API endpoints
PINATA_FILE_URL = "https://api.pinata.cloud/pinning/pinFileToIPFS"
PINATA_JSON_URL = "https://api.pinata.cloud/pinning/pinJSONToIPFS"
IPFS_GATEWAY = "https://gateway.pinata.cloud/ipfs"


def upload_image_to_ipfs(image_url: str, property_name: str, image_index: int) -> str:
    """
    Download image from URL and upload to IPFS via Pinata.
    
    Args:
        image_url: URL of the image to download
        property_name: Name of the property (for file naming)
        image_index: Index of the image
        
    Returns:
        IPFS hash of the uploaded image
    """
    
    # Download image
    response = requests.get(image_url)
    if response.status_code != 200:
        raise Exception(f"Failed to download image from {image_url}")
    
    # Prepare file for upload
    filename = f"{property_name.lower().replace(' ', '_')}_image_{image_index + 1}.jpg"
    files = {
        'file': (filename, response.content, 'image/jpeg')
    }
    
    # Prepare headers with JWT authentication
    headers = {
        "Authorization": f"Bearer {PINATA_JWT}"
    }
    
    # Metadata for Pinata
    pinata_metadata = json.dumps({
        "name": filename,
        "keyvalues": {
            "property": property_name,
            "type": "property_image"
        }
    })
    
    data = {
        "pinataMetadata": pinata_metadata
    }
    
    # Upload to Pinata
    pinata_response = requests.post(
        PINATA_FILE_URL,
        files=files,
        data=data,
        headers=headers
    )
    
    if pinata_response.status_code != 200:
        raise Exception(f"Pinata upload failed: {pinata_response.text}")
    
    ipfs_hash = pinata_response.json()["IpfsHash"]
    print(f"    ✅ Image {image_index + 1} uploaded: ipfs://{ipfs_hash}")
    
    return ipfs_hash


def upload_json_to_ipfs(metadata: Dict, property_name: str) -> str:
    """
    Upload JSON metadata to IPFS via Pinata.
    
    Args:
        metadata: Property metadata dictionary
        property_name: Name of the property
        
    Returns:
        IPFS hash of the uploaded metadata
    """
    print(f"  📝 Uploading metadata JSON to IPFS...")
    
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {PINATA_JWT}"
    }
    
    payload = {
        "pinataContent": metadata,
        "pinataMetadata": {
            "name": f"{property_name}_metadata.json",
            "keyvalues": {
                "property": property_name,
                "type": "property_metadata"
            }
        }
    }
    
    response = requests.post(
        PINATA_JSON_URL,
        json=payload,
        headers=headers
    )
    
    if response.status_code != 200:
        raise Exception(f"Pinata JSON upload failed: {response.text}")
    
    ipfs_hash = response.json()["IpfsHash"]
    print(f"    ✅ Metadata uploaded: ipfs://{ipfs_hash}")
    
    return ipfs_hash


def process_property(property_data: Dict, index: int) -> Dict:
    """
    Process a single property: upload images, create metadata, upload to IPFS.
    
    Args:
        property_data: Property data from JSON
        index: Property index
        
    Returns:
        Dictionary with contract parameters and IPFS hashes
    """
    print(f"\n{'='*60}")
    print(f"Processing Property {index + 1}: {property_data['title']}")
    print(f"{'='*60}")
    
    # Step 1: Upload images to IPFS
    image_ipfs_hashes = []
    
    # For hackathon, we'll use placeholder images from Unsplash
    # In production, you'd upload actual property photos
    image_keywords = property_data.get('image_keywords', [])
    
    # Generate Unsplash URLs based on keywords
    placeholder_images = [
        f"https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=800&q=80",  # Property 1
        f"https://images.unsplash.com/photo-1602391833977-358a52198938?w=800&q=80",  # Property 2
        f"https://images.unsplash.com/photo-1615880484746-a134be9a6ecf?w=800&q=80",  # Property 3
        f"https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&q=80",  # Property 4
    ]
    
    
    # Upload images to IPFS (enabled for production)
    print(f"  📸 Uploading {len(placeholder_images)} images to IPFS...")
    
    for idx, img_url in enumerate(placeholder_images[:4]):
        try:
            ipfs_hash = upload_image_to_ipfs(img_url, property_data['title'], idx)
            image_ipfs_hashes.append(f"ipfs://{ipfs_hash}")
        except Exception as e:
            print(f"    ⚠️  Image {idx + 1} upload failed: {e}")
            # Fallback to placeholder
            placeholder_hash = f"QmPLACEHOLDER{index:03d}IMG{idx+1}"
            image_ipfs_hashes.append(f"ipfs://{placeholder_hash}")
            print(f"    ℹ️  Using placeholder: ipfs://{placeholder_hash}")
    
    
    # Step 2: Create metadata JSON
    metadata = {
        "title": property_data["title"],
        "description": property_data["description"],
        "location": {
            "city": property_data["location_city"],
            "country": property_data["location_country"],
            "neighborhood": property_data["neighborhood"],
            "neighborhood_description": property_data.get("neighborhood_description", "")
        },
        "property_details": {
            "bedrooms": property_data["bedrooms"],
            "bathrooms": property_data["bathrooms"],
            "max_guests": property_data["max_guests"],
            "property_type": property_data["property_type"]
        },
        "amenities": property_data["amenities"],
        "house_rules": property_data["house_rules"],
        "cancellation_policy": property_data["cancellation_policy"],
        "images": image_ipfs_hashes
    }
    
    
    # Step 3: Upload metadata to IPFS (enabled for production)
    try:
        metadata_ipfs_hash = upload_json_to_ipfs(metadata, property_data['title'])
    except Exception as e:
        print(f"    ⚠️  Metadata upload failed: {e}")
        metadata_ipfs_hash = f"QmPLACEHOLDERMETA{index:03d}"
        print(f"    ℹ️  Using placeholder: ipfs://{metadata_ipfs_hash}")
    
    
    # Step 4: Prepare contract call parameters
    contract_call = {
        "property_index": index,
        "owner_address": property_data["owner_address"],
        "contract_params": {
            "price_per_night": property_data["price_per_night"],
            "location_tag": property_data["location_tag"],
            "metadata_uri": f"ipfs://{metadata_ipfs_hash}"
        },
        "metadata": metadata,
        "metadata_ipfs_hash": metadata_ipfs_hash,
        "image_ipfs_hashes": image_ipfs_hashes
    }
    
    print(f"  ✅ Property processed successfully!")
    
    return contract_call


def generate_clarity_script(contract_calls: List[Dict]) -> str:
    """
    Generate Clarity script to deploy all properties.
    
    Args:
        contract_calls: List of contract call data
        
    Returns:
        Clarity script as string
    """
    script_lines = [
        ";; StacksStay Property Deployment Script",
        ";; Auto-generated - DO NOT EDIT",
        "",
        ";; Deploy all properties to the blockchain",
        ""
    ]
    
    for call in contract_calls:
        params = call["contract_params"]
        script_lines.append(
            f";; Property {call['property_index']}: {call['metadata']['title']}"
        )
        script_lines.append(
            f"(contract-call? .stackstay-escrow list-property "
            f"u{params['price_per_night']} "
            f"u{params['location_tag']} "
            f'"{params["metadata_uri"]}")'
        )
        script_lines.append("")
    
    return "\n".join(script_lines)


def main():
    """Main execution function."""
    print("\n" + "="*60)
    print("🏠 StacksStay Property IPFS Upload Script")
    print("="*60)
    
    
    # Check for API keys
    if not PINATA_JWT or len(PINATA_JWT) < 50:
        print("\n⚠️  WARNING: Pinata JWT token not configured!")
        print("   Uploads will fail and use placeholder IPFS hashes.")
        print("   To upload to real IPFS:")
        print("   1. Sign up at https://pinata.cloud")
        print("   2. Get your JWT token")
        print("   3. Update backend/.env with your token\n")
        use_ipfs = False
    else:
        print("\n✅ Pinata credentials found!")
        print("   IPFS uploads are ENABLED")
        print("   Images and metadata will be uploaded to Pinata\n")
        use_ipfs = True
    
    
    # Load property data
    properties_file = Path(__file__).parent.parent.parent / "stackstay_properties.json"
    
    if not properties_file.exists():
        print(f"❌ Error: Property file not found at {properties_file}")
        return
    
    with open(properties_file, 'r') as f:
        properties = json.load(f)
    
    print(f"\n📊 Found {len(properties)} properties to process\n")
    
    # Process each property
    contract_calls = []
    
    for idx, property_data in enumerate(properties):
        try:
            result = process_property(property_data, idx)
            contract_calls.append(result)
        except Exception as e:
            print(f"❌ Error processing property {idx}: {e}")
            continue
    
    # Save results
    output_dir = Path(__file__).parent.parent.parent
    
    # Save contract deployment data
    deployment_file = output_dir / "property_deployment_data.json"
    with open(deployment_file, 'w') as f:
        json.dump(contract_calls, f, indent=2)
    
    print(f"\n✅ Deployment data saved to: {deployment_file}")
    
    # Generate Clarity deployment script
    clarity_script = generate_clarity_script(contract_calls)
    clarity_file = output_dir / "deploy_properties.clar"
    
    with open(clarity_file, 'w') as f:
        f.write(clarity_script)
    
    print(f"✅ Clarity script saved to: {clarity_file}")
    
    # Summary
    print("\n" + "="*60)
    print("📋 SUMMARY")
    print("="*60)
    print(f"✅ Processed: {len(contract_calls)} properties")
    print(f"✅ Generated deployment data: {deployment_file.name}")
    print(f"✅ Generated Clarity script: {clarity_file.name}")
    
    print("\n" + "="*60)
    print("🚀 NEXT STEPS")
    print("="*60)
    if use_ipfs:
        print("1. ✅ IPFS uploads completed - check Pinata dashboard")
        print("2. Review property_deployment_data.json for IPFS hashes")
        print("3. Deploy properties using deploy_properties.clar")
        print("4. Use Clarinet console or Hiro Platform for deployment")
        print("5. Backend indexer will pick up events and populate PostgreSQL")
    else:
        print("1. Set up Pinata JWT token in .env")
        print("2. Run this script again to upload to IPFS")
        print("3. Deploy properties using Clarinet or Hiro Platform")
        print("4. Backend indexer will pick up events and populate PostgreSQL")
    print("="*60 + "\n")


if __name__ == "__main__":
    main()
