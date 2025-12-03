#!/usr/bin/env python3
"""
Test IPFS upload with just 3 properties to verify Pinata integration works.
"""

import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

# Import the main upload script
from upload_properties_to_ipfs import *

def test_upload():
    """Test upload with just 3 properties."""
    print("\n" + "="*60)
    print("🧪 Testing IPFS Upload (3 properties)")
    print("="*60)
    
    # Check credentials
    if not PINATA_JWT or len(PINATA_JWT) < 50:
        print("\n❌ Error: Pinata JWT token not configured!")
        print("   Please check backend/.env file\n")
        return
    
    print("\n✅ Pinata credentials found!")
    print("   Testing upload with 3 properties...\n")
    
    # Load property data
    properties_file = Path(__file__).parent.parent.parent / "stackstay_properties.json"
    
    if not properties_file.exists():
        print(f"❌ Error: Property file not found at {properties_file}")
        return
    
    with open(properties_file, 'r') as f:
        all_properties = json.load(f)
    
    # Test with just first 3 properties
    test_properties = all_properties[:3]
    
    print(f"📊 Testing with {len(test_properties)} properties\n")
    
    # Process properties
    contract_calls = []
    
    for idx, property_data in enumerate(test_properties):
        try:
            result = process_property(property_data, idx)
            contract_calls.append(result)
        except Exception as e:
            print(f"❌ Error processing property {idx}: {e}")
            import traceback
            traceback.print_exc()
            continue
    
    # Save test results
    output_dir = Path(__file__).parent.parent.parent
    test_file = output_dir / "test_ipfs_upload.json"
    
    with open(test_file, 'w') as f:
        json.dump(contract_calls, f, indent=2)
    
    print(f"\n✅ Test results saved to: {test_file}")
    
    # Summary
    print("\n" + "="*60)
    print("📋 TEST SUMMARY")
    print("="*60)
    print(f"✅ Processed: {len(contract_calls)}/{len(test_properties)} properties")
    
    # Check if any real IPFS hashes were generated
    real_uploads = 0
    for call in contract_calls:
        if "PLACEHOLDER" not in call["metadata_ipfs_hash"]:
            real_uploads += 1
    
    if real_uploads > 0:
        print(f"✅ Real IPFS uploads: {real_uploads}")
        print("✅ Pinata integration working!")
    else:
        print("⚠️  All uploads used placeholders")
        print("   Check error messages above")
    
    print("="*60 + "\n")

if __name__ == "__main__":
    test_upload()
