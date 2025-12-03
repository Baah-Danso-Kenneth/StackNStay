"""
Simple IPFS Property Processor for StacksStay
Generates deployment-ready data without external dependencies
"""

import json
from pathlib import Path


def process_properties():
    """Process properties and generate deployment data."""
    
    print("\n" + "="*70)
    print("🏠 StacksStay Property Deployment Data Generator")
    print("="*70)
    
    # Load property data
    properties_file = Path(__file__).parent.parent.parent / "stackstay_properties.json"
    
    if not properties_file.exists():
        print(f"❌ Error: Property file not found at {properties_file}")
        return
    
    with open(properties_file, 'r') as f:
        properties = json.load(f)
    
    print(f"\n📊 Processing {len(properties)} properties...\n")
    
    deployment_data = []
    clarity_calls = []
    
    for idx, prop in enumerate(properties):
        # Generate placeholder IPFS hash for metadata
        metadata_hash = f"QmStacksStayProperty{idx:03d}Metadata"
        
        # Create IPFS metadata structure
        metadata = {
            "title": prop["title"],
            "description": prop["description"],
            "location": {
                "city": prop["location_city"],
                "country": prop["location_country"],
                "neighborhood": prop.get("neighborhood", ""),
                "neighborhood_description": prop.get("neighborhood_description", "")
            },
            "property_details": {
                "bedrooms": prop["bedrooms"],
                "bathrooms": prop["bathrooms"],
                "max_guests": prop["max_guests"],
                "property_type": prop["property_type"]
            },
            "amenities": prop["amenities"],
            "house_rules": prop["house_rules"],
            "cancellation_policy": prop["cancellation_policy"],
            "images": [
                f"ipfs://QmStacksStayProperty{idx:03d}Image{i+1}"
                for i in range(4)
            ]
        }
        
        # Deployment data
        deployment_item = {
            "property_id": idx,
            "owner_address": prop["owner_address"],
            "blockchain_params": {
                "price_per_night": prop["price_per_night"],
                "location_tag": prop["location_tag"],
                "metadata_uri": f"ipfs://{metadata_hash}"
            },
            "ipfs_metadata": metadata,
            "metadata_ipfs_hash": metadata_hash
        }
        
        deployment_data.append(deployment_item)
        
        # Generate Clarity contract call
        clarity_call = (
            f";; Property {idx}: {prop['title'][:50]}\n"
            f"(contract-call? .stackstay-escrow list-property "
            f"u{prop['price_per_night']} "
            f"u{prop['location_tag']} "
            f'"{deployment_item["blockchain_params"]["metadata_uri"]}")'
        )
        clarity_calls.append(clarity_call)
        
        print(f"  ✅ Property {idx + 1:2d}: {prop['title'][:50]}")
    
    # Save deployment data
    output_dir = Path(__file__).parent.parent.parent
    
    deployment_file = output_dir / "property_deployment_data.json"
    with open(deployment_file, 'w') as f:
        json.dump(deployment_data, f, indent=2)
    
    # Save Clarity script
    clarity_script = (
        ";; StacksStay Property Deployment Script\n"
        ";; Auto-generated from property data\n"
        ";;\n"
        ";; INSTRUCTIONS:\n"
        ";; 1. Deploy stackstay-escrow contract first\n"
        ";; 2. Run these calls from the property owner's wallet\n"
        ";; 3. Each call will create a new property on-chain\n"
        ";;\n"
        ";; NOTE: Replace placeholder IPFS hashes with real ones from Pinata\n\n"
        + "\n\n".join(clarity_calls)
    )
    
    clarity_file = output_dir / "deploy_properties.clar"
    with open(clarity_file, 'w') as f:
        f.write(clarity_script)
    
    # Generate README
    readme = f"""# StacksStay Property Deployment Guide

## Files Generated

1. **property_deployment_data.json** - Complete deployment data with IPFS metadata
2. **deploy_properties.clar** - Clarity contract calls to deploy properties

## Deployment Process

### Step 1: Upload to IPFS (Production)

For a real deployment, you need to:

1. **Get Pinata API Keys**
   - Sign up at https://pinata.cloud (free tier available)
   - Get your API Key and Secret Key
   - Add to `backend/.env`:
     ```
     PINATA_API_KEY=your_actual_key
     PINATA_SECRET_KEY=your_actual_secret
     ```

2. **Upload Images**
   - For each property, upload 3-5 images to IPFS
   - Save the IPFS hashes (e.g., `QmXxx...`)

3. **Upload Metadata**
   - Create JSON file with property details + image IPFS hashes
   - Upload to IPFS
   - Save metadata IPFS hash

### Step 2: Deploy to Blockchain

**Option A: Using Clarinet (Local Testing)**
```bash
cd stackstay
clarinet console
# Copy-paste contract calls from deploy_properties.clar
```

**Option B: Using Hiro Platform (Testnet)**
1. Go to https://platform.hiro.so
2. Connect your wallet
3. Call `list-property` for each property with:
   - price-per-night (in micro-STX)
   - location-tag (1-10)
   - metadata-uri (IPFS hash)

**Option C: Using Stacks.js (Programmatic)**
```javascript
// See example in frontend/src/lib/contracts.ts
await listProperty({{
  pricePerNight: 18000000,
  locationTag: 1,
  metadataUri: "ipfs://QmXxx..."
}});
```

### Step 3: Backend Indexing

Your FastAPI backend should:

1. **Watch for blockchain events**
   ```python
   # Listen for new property listings
   # Fetch IPFS metadata
   # Store in PostgreSQL
   ```

2. **Index into database**
   - blockchain_id (from contract)
   - owner_address
   - price_per_night
   - location_tag
   - metadata_uri
   - All fields from IPFS metadata

## For Hackathon Demo (Quick Start)

If you need a working demo quickly:

1. **Skip IPFS upload** - Use placeholder hashes
2. **Seed database directly** - Insert properties into PostgreSQL
3. **Demo booking flow** - Show real blockchain escrow
4. **Explain architecture** - Show how production would work

## Current Status

- ✅ {len(properties)} properties generated
- ⚠️  Using placeholder IPFS hashes
- ⚠️  Need to upload to real IPFS for production
- ✅ Contract calls ready in deploy_properties.clar

## Next Steps

1. Set up Pinata API keys
2. Upload images to IPFS
3. Upload metadata to IPFS
4. Update deployment data with real IPFS hashes
5. Deploy to blockchain
6. Let backend indexer populate database
"""
    
    readme_file = output_dir / "DEPLOYMENT_GUIDE.md"
    with open(readme_file, 'w') as f:
        f.write(readme)
    
    # Summary
    print("\n" + "="*70)
    print("📋 SUMMARY")
    print("="*70)
    print(f"✅ Processed: {len(properties)} properties")
    print(f"✅ Generated: {deployment_file.name}")
    print(f"✅ Generated: {clarity_file.name}")
    print(f"✅ Generated: {readme_file.name}")
    
    print("\n" + "="*70)
    print("🚀 NEXT STEPS")
    print("="*70)
    print("1. Review DEPLOYMENT_GUIDE.md for detailed instructions")
    print("2. For PRODUCTION: Get Pinata API keys and upload to IPFS")
    print("3. For HACKATHON DEMO: Use placeholder data and seed database")
    print("4. Deploy properties using deploy_properties.clar")
    print("="*70 + "\n")


if __name__ == "__main__":
    process_properties()
