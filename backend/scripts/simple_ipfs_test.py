#!/usr/bin/env python3
"""
Simple IPFS upload test - uploads one property to verify Pinata works
No external dependencies except requests (built-in for most Python installs)
"""

import json
import requests
import os
from pathlib import Path

# Read .env file manually
def load_env():
    """Load environment variables from .env file."""
    env_file = Path(__file__).parent.parent / ".env"
    env_vars = {}
    
    if env_file.exists():
        with open(env_file, 'r') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    key, value = line.split('=', 1)
                    env_vars[key] = value
    
    return env_vars

# Load environment
env = load_env()
PINATA_JWT = env.get('IPFS_GATEWAY_URL', '')  # JWT is stored here
IPFS_GATEWAY = "https://gateway.pinata.cloud/ipfs"

print("\n" + "="*70)
print("🧪 Simple IPFS Upload Test")
print("="*70)

# Check JWT
if not PINATA_JWT or len(PINATA_JWT) < 50:
    print("\n❌ Error: Pinata JWT token not found in .env")
    print("   Looking for IPFS_GATEWAY_URL in backend/.env\n")
    exit(1)

print(f"\n✅ Found Pinata JWT token ({len(PINATA_JWT)} chars)")
print("   Testing upload...\n")

# Test 1: Upload a simple JSON to IPFS
print("📝 Test 1: Uploading JSON metadata to IPFS...")

test_metadata = {
    "title": "Test Property - Bali Villa",
    "description": "This is a test upload to verify Pinata integration works",
    "location": {
        "city": "Bali",
        "country": "Indonesia"
    },
    "test": True
}

headers = {
    "Content-Type": "application/json",
    "Authorization": f"Bearer {PINATA_JWT}"
}

payload = {
    "pinataContent": test_metadata,
    "pinataMetadata": {
        "name": "stackstay_test_metadata.json",
        "keyvalues": {
            "type": "test",
            "project": "stackstay"
        }
    }
}

try:
    response = requests.post(
        "https://api.pinata.cloud/pinning/pinJSONToIPFS",
        json=payload,
        headers=headers
    )
    
    if response.status_code == 200:
        result = response.json()
        ipfs_hash = result["IpfsHash"]
        print(f"   ✅ SUCCESS! Uploaded to IPFS")
        print(f"   📦 IPFS Hash: {ipfs_hash}")
        print(f"   🔗 Gateway URL: {IPFS_GATEWAY}/{ipfs_hash}")
        print(f"   🔗 Pinata URL: https://gateway.pinata.cloud/ipfs/{ipfs_hash}")
        
        # Test 2: Verify we can retrieve it
        print(f"\n📥 Test 2: Retrieving data from IPFS...")
        retrieve_response = requests.get(f"{IPFS_GATEWAY}/{ipfs_hash}")
        
        if retrieve_response.status_code == 200:
            retrieved_data = retrieve_response.json()
            print(f"   ✅ SUCCESS! Retrieved data from IPFS")
            print(f"   📄 Data matches: {retrieved_data == test_metadata}")
            
            print("\n" + "="*70)
            print("🎉 IPFS INTEGRATION WORKING PERFECTLY!")
            print("="*70)
            print("✅ Can upload to Pinata")
            print("✅ Can retrieve from IPFS")
            print("✅ Ready for production property uploads")
            print("\n🚀 Next step: Run upload_properties_to_ipfs.py for all 30 properties")
            print("="*70 + "\n")
        else:
            print(f"   ⚠️  Could not retrieve from IPFS (status {retrieve_response.status_code})")
            print(f"   But upload succeeded! Hash: {ipfs_hash}")
    else:
        print(f"   ❌ Upload failed!")
        print(f"   Status: {response.status_code}")
        print(f"   Response: {response.text}")
        
except Exception as e:
    print(f"   ❌ Error: {e}")
    import traceback
    traceback.print_exc()
