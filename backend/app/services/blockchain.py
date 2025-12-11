"""
Blockchain Service - Stacks Integration
Fetches property data from StackNStay smart contract and IPFS
"""
import os
import httpx
import struct
from typing import Optional, Dict, Any, List
from dotenv import load_dotenv

load_dotenv()

# Configuration
STACKS_API_URL = os.getenv("STACKS_API_URL")
CONTRACT_ADDRESS = os.getenv("STACKS_CONTRACT_ADDRESS")

# All contract names
CONTRACT_ESCROW = os.getenv("STACKS_CONTRACT_ESCROW", "stackstay-escrow")
CONTRACT_BADGE = os.getenv("STACKS_CONTRACT_BADGE", "stackstay-badge")
CONTRACT_REPUTATION = os.getenv("STACKS_CONTRACT_REPUTATION", "stackstay-reputation")
CONTRACT_DISPUTE = os.getenv("STACKS_CONTRACT_DISPUTE", "stackstay-dispute")

IPFS_GATEWAY = os.getenv("IPFS_GATEWAY")
PINATA_JWT = os.getenv("PINATA_JWT")

# Badge type constants (matching Clarity contract)
BADGE_TYPES = {
    1: "first-booking",
    2: "first-listing",
    3: "superhost",
    4: "frequent-traveler",
    5: "early-adopter",
    6: "perfect-host",
    7: "globe-trotter",
    8: "top-earner"
}


class ClarityParser:
    """Simplified Clarity value parser"""
    
    @staticmethod
    def parse_optional(hex_str: str) -> Optional[Dict[str, Any]]:
        """Parse Clarity Optional type"""
        if not hex_str.startswith("0x"):
            return None
            
        # 0x09 = Some, 0x0a = None
        type_byte = hex_str[2:4]
        
        if type_byte == "0a":  # None
            return None
        elif type_byte == "09":  # Some
            # The rest is the wrapped value
            return ClarityParser.parse_tuple(hex_str[4:])
        else:
            return None
    
    @staticmethod
    def parse_tuple(hex_str: str) -> Optional[Dict[str, Any]]:
        """
        Parse Clarity Tuple type
        This is a simplified parser for the property tuple structure
        """
        try:
            # For our property tuple, we'll use a hybrid approach:
            # 1. Try to extract metadata-uri string (both ipfs:// and bare hashes)
            # 2. Try to extract uint values
            # 3. Return a best-effort parsed result
            
            result = {}
            
            # Extract metadata-uri
            # Try format 1: Full URI with "ipfs://" prefix (ASCII: 697066733a2f2f)
            if "697066733a2f2f" in hex_str:
                metadata_uri = ClarityParser._extract_ascii_string(hex_str, "697066733a2f2f")
                if metadata_uri:
                    result["metadata_uri"] = metadata_uri
                    print(f"📝 Extracted ipfs:// URI: {metadata_uri}")
            
            # Try format 2: Bare IPFS hash starting with "Qm" (ASCII: 516d)
            # This handles cases where contract stores just "QmXXXX..." without ipfs:// prefix
            if "metadata_uri" not in result and "516d" in hex_str:
                bare_hash = ClarityParser._extract_ascii_string(hex_str, "516d")
                if bare_hash and bare_hash.startswith("Qm") and len(bare_hash) == 46:
                    # Valid IPFS v0 CID (always 46 chars, starts with Qm)
                    result["metadata_uri"] = f"ipfs://{bare_hash}"
                    print(f"📝 Extracted bare IPFS hash: {bare_hash} -> ipfs://{bare_hash}")
            
            # Extract owner (principal) - look for principal type (0x05 or 0x06)
            # Principals start with version byte, we'll extract the address representation
            owner = ClarityParser._extract_principal(hex_str)
            if owner:
                result["owner"] = owner
            
            # For uint values (price-per-night, location-tag, created-at),
            # we need more sophisticated parsing or fallback to defaults
            # Since Clarity tuples are complex, we'll rely on IPFS metadata for most fields
            
            result["active"] = True  # Assume active if we got the property
            
            return result if result else None
            
        except Exception as e:
            print(f"❌ Error parsing tuple: {e}")
            return None
    
    @staticmethod
    def _extract_ascii_string(hex_str: str, start_pattern: str) -> Optional[str]:
        """Extract ASCII string from hex, starting after a pattern"""
        try:
            if start_pattern not in hex_str:
                return None
                
            # Find the pattern
            start_idx = hex_str.find(start_pattern)
            
            # Strings in Clarity have a length prefix (4 bytes = 8 hex chars)
            # But for simplicity, we'll just extract until we hit non-ASCII
            
            # Extract a reasonable chunk (up to 512 chars = 1024 hex chars)
            chunk_start = start_idx
            chunk = hex_str[chunk_start:chunk_start + 1024]
            
            # Convert hex to bytes and then to string
            # Take only printable ASCII characters
            result = ""
            for i in range(0, len(chunk), 2):
                if i + 2 > len(chunk):
                    break
                byte_hex = chunk[i:i+2]
                try:
                    byte_val = int(byte_hex, 16)
                    # Printable ASCII range
                    if 32 <= byte_val <= 126:
                        result += chr(byte_val)
                    elif byte_val == 0:  # Null terminator
                        break
                    else:
                        # Non-ASCII, might be end of string
                        if len(result) > 10:  # Only break if we have some content
                            break
                except:
                    break
            
            return result if result else None
            
        except Exception as e:
            return None
    
    @staticmethod
    def _extract_principal(hex_str: str) -> Optional[str]:
        """Extract Stacks principal (address) from hex"""
        try:
            # Look for principal type bytes (0x05 for standard, 0x06 for contract)
            if "05" in hex_str or "06" in hex_str:
                # This is complex - principals are encoded with version + hash
                # For now, return a placeholder indicating we found a principal
                return "ST..."  # Placeholder - proper extraction requires more work
            return None
        except Exception as e:
            return None


class BlockchainService:
    """Service for interacting with Stacks blockchain and IPFS"""
    
    def __init__(self):
        self.api_url = STACKS_API_URL
        self.contract_address = CONTRACT_ADDRESS
        self.contract_escrow = CONTRACT_ESCROW
        self.contract_badge = CONTRACT_BADGE
        self.contract_reputation = CONTRACT_REPUTATION
        self.contract_dispute = CONTRACT_DISPUTE
        self.ipfs_gateway = IPFS_GATEWAY
        self.parser = ClarityParser()
        
    async def get_property_count(self) -> int:
        """
        Get total number of properties from smart contract
        Reads the property-id-nonce variable
        """
        try:
            url = f"{self.api_url}/v2/contracts/call-read/{self.contract_address}/{self.contract_escrow}/property-id-nonce"
            
            print(f"\n🔍 Calling property-id-nonce API:")
            print(f"   URL: {url}")
            
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    url,
                    json={
                        "sender": self.contract_address,
                        "arguments": []
                    },
                    timeout=10.0
                )
                
                print(f"   Status: {response.status_code}")
                
                if response.status_code == 200:
                    data = response.json()
                    print(f"   Response: {data}")
                    
                    if data.get("okay") and "result" in data:
                        result = data["result"]
                        # Parse uint: 0x0100000000000000000000000000000005 = uint 5
                        if result.startswith("0x01"):
                            # Extract last 16 hex chars (8 bytes for uint64)
                            count = int(result[-16:], 16)
                            return count
                    return 0
                else:
                    return 0
                    
        except Exception as e:
            return 0
    
    async def get_property(self, property_id: int) -> Optional[Dict[str, Any]]:
        """
        Get property details from smart contract
        Calls the get-property read-only function
        """
        try:
            url = f"{self.api_url}/v2/contracts/call-read/{self.contract_address}/{self.contract_escrow}/get-property"
            
            # Convert property_id to Clarity uint format (0x01 + 16 bytes)
            property_id_hex = f"0x01{property_id:032x}"
            
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    url,
                    json={
                        "sender": self.contract_address,
                        "arguments": [property_id_hex]
                    },
                    timeout=10.0
                )
                
                print(f"\n📞 API Response for property #{property_id}:")
                print(f"   Status: {response.status_code}")
                
                if response.status_code == 200:
                    data = response.json()
                    print(f"   Full response: {data}")
                    
                    if data.get("okay") and "result" in data:
                        result = data["result"]
                        print(f"   Result hex: {result[:200]}...")  # First 200 chars
                        
                        parsed = None
                        
                        # Handle different response formats:
                        # Format 1: Optional(Some(tuple)) - starts with 0x09
                        if result.startswith("0x09"):
                            print(f"   Parsing as Optional(Some)...")
                            parsed = self.parser.parse_optional(result)
                        
                        # Format 2: Direct tuple - starts with 0x0c or 0x0a0c
                        elif result.startswith("0x0c") or result.startswith("0x0a0c"):
                            print(f"   Parsing as direct tuple...")
                            # Skip the 0x0a prefix if present (response wrapper)
                            tuple_hex = result[4:] if result.startswith("0x0a0c") else result[2:]
                            parsed = self.parser.parse_tuple(tuple_hex)
                        
                        # Format 3: Optional(None) - starts with 0x0a (but not 0x0a0c)
                        elif result.startswith("0x0a") and not result.startswith("0x0a0c"):
                            print(f"   Result is Optional(None)")
                            return None
                        
                        print(f"   Parsed result: {parsed}")
                        
                        if parsed and "metadata_uri" in parsed:
                            return {
                                "property_id": property_id,
                                "owner": parsed.get("owner", "ST..."),
                                "metadata_uri": parsed["metadata_uri"],
                                "active": parsed.get("active", True)
                            }
                        else:
                            print(f"   ⚠️ No metadata_uri in parsed result")
                    
                    return None
                else:
                    print(f"   ❌ HTTP Error: {response.status_code}")
                    return None
                    
        except Exception as e:
            print(f"   ❌ Exception: {e}")
            return None
    
    async def fetch_ipfs_metadata(self, ipfs_uri: str) -> Optional[Dict[str, Any]]:
        """
        Fetch property metadata from IPFS
        Handles both ipfs:// URIs and direct IPFS hashes
        """
        try:
            # Clean the IPFS URI
            ipfs_hash = ipfs_uri
            if ipfs_hash.startswith("ipfs://"):
                ipfs_hash = ipfs_hash.replace("ipfs://", "")
            
            # Remove any trailing garbage characters
            ipfs_hash = ipfs_hash.split()[0].strip()
            
            url = f"{self.ipfs_gateway}/{ipfs_hash}"
            
            async with httpx.AsyncClient() as client:
                response = await client.get(url, timeout=15.0)
                
                if response.status_code == 200:
                    metadata = response.json()
                    return metadata
                else:
                    return None
                    
        except Exception as e:
            return None

    # Pinata fallback removed to prevent dummy data

    
    async def get_user_badges(self, user_address: str) -> List[str]:
        """Get all badges earned by a user"""
        badges = []
        
        try:
            async with httpx.AsyncClient() as client:
                for badge_type in range(1, 9):
                    url = f"{self.api_url}/v2/contracts/call-read/{self.contract_address}/{self.contract_badge}/has-badge"
                    
                    principal_hex = self._encode_principal(user_address)
                    badge_type_hex = f"0x01{badge_type:032x}"
                    
                    response = await client.post(
                        url,
                        json={
                            "sender": self.contract_address,
                            "arguments": [principal_hex, badge_type_hex]
                        },
                        timeout=5.0
                    )
                    
                    if response.status_code == 200:
                        data = response.json()
                        if data.get("okay") and data.get("result") == "0x03":
                            badges.append(BADGE_TYPES[badge_type])
                            
        except Exception as e:
            print(f"Error fetching badges for {user_address}: {e}")
        
        return badges
    
    async def get_user_reputation(self, user_address: str) -> Optional[Dict[str, Any]]:
        """Get user reputation statistics"""
        try:
            url = f"{self.api_url}/v2/contracts/call-read/{self.contract_address}/{self.contract_reputation}/get-user-stats"
            
            principal_hex = self._encode_principal(user_address)
            
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    url,
                    json={
                        "sender": self.contract_address,
                        "arguments": [principal_hex]
                    },
                    timeout=5.0
                )
                
                if response.status_code == 200:
                    data = response.json()
                    if data.get("okay") and "result" in data:
                        result = data["result"]
                        if result.startswith("0x09"):  # Some
                            return {
                                "total_reviews": 0,
                                "average_rating": 0,
                                "total_rating_sum": 0
                            }
                        else:
                            return {
                                "total_reviews": 0,
                                "average_rating": 0,
                                "total_rating_sum": 0
                            }
                    return None
                    
        except Exception as e:
            print(f"Error fetching reputation for {user_address}: {e}")
            return None
    
    def _encode_principal(self, address: str) -> str:
        """Encode a Stacks address as a Clarity principal (simplified)"""
        return f"0x05{address}"
    
    async def enrich_property_data(self, property_data: Dict[str, Any]) -> Dict[str, Any]:
        """Enrich property data with badges and reputation"""
        enriched = property_data.copy()
        
        owner = property_data.get("owner")
        
        if owner and owner != "ST...":
            badges = await self.get_user_badges(owner)
            if badges:
                enriched["host_badges"] = badges
                enriched["is_superhost"] = "superhost" in badges
            
            reputation = await self.get_user_reputation(owner)
            if reputation:
                enriched["host_reputation"] = {
                    "average_rating": reputation.get("average_rating", 0) / 100,
                    "total_reviews": reputation.get("total_reviews", 0)
                }
        
        return enriched
    
    async def get_all_properties(self) -> List[Dict[str, Any]]:
        """
        Fetch all properties from blockchain + IPFS
        Since property-id-nonce might not exist, we try sequential IDs until we get None
        """
        print(f"🔗 Connecting to Stacks node: {self.api_url}")
        print(f"📜 Contract: {self.contract_address}.{self.contract_escrow}")
        
        properties = []
        property_id = 0
        max_attempts = 100  # Safety limit
        consecutive_failures = 0
        
        # Try fetching properties sequentially
        while property_id < max_attempts and consecutive_failures < 3:
            try:
                print(f"🔍 Trying to fetch property #{property_id}...")
                property_data = await self.get_property(property_id)
                
                if property_data and property_data.get("metadata_uri"):
                    print(f"✅ Found property #{property_id}")
                    metadata = await self.fetch_ipfs_metadata(property_data["metadata_uri"])
                    
                    if metadata:
                        full_property = {
                            **metadata,
                            "property_id": property_id,
                            "owner": property_data.get("owner", "ST..."),
                            "active": property_data.get("active", True)
                        }
                        
                        enriched = await self.enrich_property_data(full_property)
                        properties.append(enriched)
                        consecutive_failures = 0  # Reset on success
                    else:
                        print(f"⚠️ Failed to fetch IPFS metadata for property #{property_id}")
                        consecutive_failures += 1
                else:
                    print(f"⚠️ Property #{property_id} not found or no metadata URI")
                    consecutive_failures += 1
                    
            except Exception as e:
                print(f"❌ Error processing property #{property_id}: {e}")
                consecutive_failures += 1
            
            property_id += 1
        
        print(f"🔢 Found {len(properties)} properties on blockchain")
        
        if not properties:
            print("⚠️ No properties found on blockchain.")
        
        return properties


# Singleton instance
blockchain_service = BlockchainService()