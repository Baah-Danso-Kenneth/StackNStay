"""
Blockchain Service - Stacks Integration
Fetches property data from StackNStay smart contract and IPFS
"""
import os
import httpx
from typing import Optional, Dict, Any, List
from dotenv import load_dotenv

load_dotenv()

# Configuration
STACKS_API_URL = os.getenv("STACKS_API_URL", "https://api.testnet.hiro.so")
CONTRACT_ADDRESS = os.getenv("STACKS_CONTRACT_ADDRESS", "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM")
CONTRACT_NAME = os.getenv("STACKS_CONTRACT_NAME", "stackstay-escrow")
IPFS_GATEWAY = os.getenv("IPFS_GATEWAY", "https://gateway.pinata.cloud/ipfs")


class BlockchainService:
    """Service for interacting with Stacks blockchain and IPFS"""
    
    def __init__(self):
        self.api_url = STACKS_API_URL
        self.contract_address = CONTRACT_ADDRESS
        self.contract_name = CONTRACT_NAME
        self.ipfs_gateway = IPFS_GATEWAY
        
    async def get_property_count(self) -> int:
        """
        Get total number of properties from smart contract
        Reads the property-id-nonce variable
        """
        try:
            url = f"{self.api_url}/v2/contracts/call-read/{self.contract_address}/{self.contract_name}/property-id-nonce"
            
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    url,
                    json={
                        "sender": self.contract_address,
                        "arguments": []
                    },
                    timeout=10.0
                )
                
                if response.status_code == 200:
                    data = response.json()
                    # Parse Clarity uint response
                    if data.get("okay") and "result" in data:
                        # Result format: "0x0100000000000000000000000000000005" (uint 5)
                        result = data["result"]
                        # Extract the uint value (last part of hex string)
                        count = int(result[-16:], 16) if result.startswith("0x01") else 0
                        return count
                    return 0
                else:
                    print(f"Error fetching property count: {response.status_code}")
                    return 0
                    
        except Exception as e:
            print(f"Error in get_property_count: {e}")
            return 0
    
    async def get_property(self, property_id: int) -> Optional[Dict[str, Any]]:
        """
        Get property details from smart contract
        Calls the get-property read-only function
        """
        try:
            url = f"{self.api_url}/v2/contracts/call-read/{self.contract_address}/{self.contract_name}/get-property"
            
            # Convert property_id to Clarity uint format
            property_id_hex = f"0x{property_id:032x}"
            
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    url,
                    json={
                        "sender": self.contract_address,
                        "arguments": [property_id_hex]
                    },
                    timeout=10.0
                )
                
                if response.status_code == 200:
                    data = response.json()
                    if data.get("okay") and "result" in data:
                        # Parse the Clarity optional response
                        result = data["result"]
                        if result.startswith("0x09"):  # Some response
                            return self._parse_property_response(result, property_id)
                        else:
                            return None  # None response
                    return None
                else:
                    print(f"Error fetching property {property_id}: {response.status_code}")
                    return None
                    
        except Exception as e:
            print(f"Error in get_property: {e}")
            return None
    
    def _parse_property_response(self, clarity_result: str, property_id: int) -> Dict[str, Any]:
        """
        Parse Clarity tuple response into Python dict
        This is a simplified parser - in production, use a proper Clarity parser
        """
        # For now, return a mock structure
        # TODO: Implement proper Clarity tuple parsing
        return {
            "property_id": property_id,
            "owner": "SP...",  # Parse from result
            "price_per_night": 100,  # Parse from result
            "location_tag": 1,  # Parse from result
            "metadata_uri": "",  # Parse from result
            "active": True,  # Parse from result
        }
    
    async def fetch_ipfs_metadata(self, ipfs_hash: str) -> Optional[Dict[str, Any]]:
        """
        Fetch property metadata from IPFS
        """
        try:
            # Clean the IPFS hash
            if ipfs_hash.startswith("ipfs://"):
                ipfs_hash = ipfs_hash.replace("ipfs://", "")
            
            url = f"{self.ipfs_gateway}/{ipfs_hash}"
            
            async with httpx.AsyncClient() as client:
                response = await client.get(url, timeout=15.0)
                
                if response.status_code == 200:
                    return response.json()
                else:
                    print(f"Error fetching IPFS metadata: {response.status_code}")
                    return None
                    
        except Exception as e:
            print(f"Error in fetch_ipfs_metadata: {e}")
            return None
    
    async def get_all_properties(self) -> List[Dict[str, Any]]:
        """
        Fetch all properties with their IPFS metadata
        """
        properties = []
        
        # Get total count
        count = await self.get_property_count()
        print(f"📊 Found {count} properties on blockchain")
        
        # Fetch each property
        for property_id in range(count):
            try:
                # Get property from contract
                property_data = await self.get_property(property_id)
                
                if property_data and property_data.get("metadata_uri"):
                    # Fetch IPFS metadata
                    metadata = await self.fetch_ipfs_metadata(property_data["metadata_uri"])
                    
                    if metadata:
                        # Merge contract data with IPFS metadata
                        full_property = {
                            **property_data,
                            **metadata,
                            "property_id": property_id
                        }
                        properties.append(full_property)
                        print(f"✅ Loaded property {property_id}: {metadata.get('title', 'Unknown')}")
                    else:
                        print(f"⚠️ Could not fetch IPFS metadata for property {property_id}")
                else:
                    print(f"⚠️ Property {property_id} not found or inactive")
                    
            except Exception as e:
                print(f"❌ Error loading property {property_id}: {e}")
                continue
        
        return properties


# Singleton instance
blockchain_service = BlockchainService()
