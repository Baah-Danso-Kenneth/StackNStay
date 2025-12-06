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
        
    async def get_property_count(self) -> int:
        """
        Get total number of properties from smart contract
        Reads the property-id-nonce variable
        """
        try:
            url = f"{self.api_url}/v2/contracts/call-read/{self.contract_address}/{self.contract_escrow}/property-id-nonce"
            
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
            url = f"{self.api_url}/v2/contracts/call-read/{self.contract_address}/{self.contract_escrow}/get-property"
            
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
        """
        Parse Clarity tuple response into Python dict
        """
        try:
            # 1. Extract Metadata URI (look for ipfs:// pattern in hex)
            # ipfs:// in hex is 697066733a2f2f
            metadata_uri = ""
            if "697066733a2f2f" in clarity_result:
                # Find the start of the string
                start_index = clarity_result.find("697066733a2f2f")
                # Extract until we hit a non-printable char or end (simplified)
                # We'll take a chunk and clean it
                hex_chunk = clarity_result[start_index:]
                
                # Convert hex to ascii until it fails or hits control char
                try:
                    # Take up to 200 chars (100 bytes * 2 hex chars)
                    candidate_hex = hex_chunk[:200]
                    # Ensure even length
                    if len(candidate_hex) % 2 != 0:
                        candidate_hex = candidate_hex[:-1]
                        
                    decoded = bytes.fromhex(candidate_hex).decode('utf-8', errors='ignore')
                    # Clean up: take until the first non-printable or weird char
                    import string
                    valid_chars = "-_.() %s%s" % (string.ascii_letters, string.digits)
                    clean_uri = ""
                    for char in decoded:
                        if char in valid_chars or char in [':', '/']:
                            clean_uri += char
                        else:
                            break
                    metadata_uri = clean_uri
                except Exception as e:
                    print(f"Error decoding hex string: {e}")

            # 2. Extract Price (look for uint pattern)
            # This is harder without a schema, but we can default to 100 if parsing fails
            # or try to find the last uint in the tuple
            price = 100
            
            return {
                "property_id": property_id,
                "owner": "SP...",  # Placeholder
                "price_per_night": price,
                "location_tag": 1,
                "metadata_uri": metadata_uri,
                "active": True,
            }
        except Exception as e:
            print(f"Error parsing property response: {e}")
            return None
    
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

    async def fetch_from_pinata(self) -> List[Dict[str, Any]]:
        """
        Directly fetch pinned properties from Pinata
        Used as fallback when blockchain index is empty
        """
        if not PINATA_JWT:
            print("⚠️ PINATA_JWT not found. Cannot fetch from Pinata.")
            return []
            
        print("🔍 Fetching pins directly from Pinata...")
        properties = []
        
        try:
            url = "https://api.pinata.cloud/data/pinList?status=pinned&pageLimit=20"
            headers = {"Authorization": f"Bearer {PINATA_JWT}"}
            
            async with httpx.AsyncClient() as client:
                response = await client.get(url, headers=headers, timeout=10.0)
                
                if response.status_code == 200:
                    data = response.json()
                    rows = data.get("rows", [])
                    print(f"📄 Found {len(rows)} pins on Pinata")
                    
                    for i, pin in enumerate(rows):
                        meta = pin.get("metadata", {})
                        name = meta.get("name", "")
                        ipfs_hash = pin.get("ipfs_pin_hash")
                        
                        # Filter by name convention "property-..."
                        if name.startswith("property-") and ipfs_hash:
                            print(f"  📥 Fetching metadata for {name} ({ipfs_hash})...")
                            prop_data = await self.fetch_ipfs_metadata(ipfs_hash)
                            
                            if prop_data:
                                # Add ID and other missing fields
                                if "property_id" not in prop_data:
                                    prop_data["property_id"] = i
                                    
                                prop_data["price_per_night"] = prop_data.get("price", prop_data.get("price_per_night", 0))
                                prop_data["location_city"] = prop_data.get("location_city", prop_data.get("location", "Unknown"))
                                
                                properties.append(prop_data)
                else:
                    print(f"❌ Error listing pins: {response.status_code}")
                    
        except Exception as e:
            print(f"❌ Error fetching from Pinata: {e}")
            
        return properties
    
    async def get_user_badges(self, user_address: str) -> List[str]:
        """
        Get all badges earned by a user
        Checks all 8 badge types
        """
        badges = []
        
        try:
            async with httpx.AsyncClient() as client:
                # Check each badge type (1-8)
                for badge_type in range(1, 9):
                    url = f"{self.api_url}/v2/contracts/call-read/{self.contract_address}/{self.contract_badge}/has-badge"
                    
                    # Convert user address to Clarity principal format
                    # For testnet addresses like ST..., we need to encode properly
                    principal_hex = self._encode_principal(user_address)
                    badge_type_hex = f"0x{badge_type:032x}"
                    
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
                        # Check if result is true (0x03 = true in Clarity)
                        if data.get("okay") and data.get("result") == "0x03":
                            badges.append(BADGE_TYPES[badge_type])
                            
        except Exception as e:
            print(f"Error fetching badges for {user_address}: {e}")
        
        return badges
    
    async def get_user_reputation(self, user_address: str) -> Optional[Dict[str, Any]]:
        """
        Get user reputation statistics
        Returns average rating, total reviews, etc.
        """
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
                        # Parse Clarity optional response
                        if result.startswith("0x09"):  # Some response
                            # TODO: Implement proper Clarity tuple parsing
                            # For now, return a simplified structure
                            return {
                                "total_reviews": 0,  # Parse from result
                                "average_rating": 0,  # Parse from result (divide by 100)
                                "total_rating_sum": 0  # Parse from result
                            }
                        else:
                            # No stats yet (new user)
                            return {
                                "total_reviews": 0,
                                "average_rating": 0,
                                "total_rating_sum": 0
                            }
                    return None
                    
        except Exception as e:
            print(f"Error fetching reputation for {user_address}: {e}")
            return None
    
    async def get_booking_dispute_status(self, booking_id: int) -> Optional[Dict[str, Any]]:
        """
        Check if a booking has an active dispute
        """
        try:
            url = f"{self.api_url}/v2/contracts/call-read/{self.contract_address}/{self.contract_dispute}/get-booking-dispute"
            
            booking_id_hex = f"0x{booking_id:032x}"
            
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    url,
                    json={
                        "sender": self.contract_address,
                        "arguments": [booking_id_hex]
                    },
                    timeout=5.0
                )
                
                if response.status_code == 200:
                    data = response.json()
                    if data.get("okay") and "result" in data:
                        result = data["result"]
                        # Parse Clarity optional response
                        if result.startswith("0x09"):  # Some response (dispute exists)
                            return {
                                "has_dispute": True,
                                "dispute_id": 0  # Parse from result
                            }
                        else:
                            return {
                                "has_dispute": False,
                                "dispute_id": None
                            }
                    return None
                    
        except Exception as e:
            print(f"Error fetching dispute status for booking {booking_id}: {e}")
            return None
    
    def _encode_principal(self, address: str) -> str:
        """
        Encode a Stacks address as a Clarity principal
        This is a simplified version - in production, use proper Clarity encoding
        """
        # For now, return a placeholder
        # TODO: Implement proper principal encoding
        # Format: 0x05 + version byte + hash160
        return f"0x05{address}"  # Simplified - needs proper encoding
    
    async def enrich_property_data(self, property_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Enrich property data with badges, reputation, and dispute info
        """
        enriched = property_data.copy()
        
        # Get owner address
        owner = property_data.get("owner")
        property_id = property_data.get("property_id")
        
        if owner:
            # Fetch host badges
            badges = await self.get_user_badges(owner)
            if badges:
                enriched["host_badges"] = badges
                enriched["is_superhost"] = "superhost" in badges
            
            # Fetch host reputation
            reputation = await self.get_user_reputation(owner)
            if reputation:
                enriched["host_reputation"] = {
                    "average_rating": reputation.get("average_rating", 0) / 100,  # Convert from 450 -> 4.5
                    "total_reviews": reputation.get("total_reviews", 0)
                }
        
        # Note: Dispute status is per-booking, not per-property
        # We'll skip this for property listings, but it could be added for individual bookings
        
        return enriched
    
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
                        
                        # Enrich with badges, reputation, and dispute data
                        enriched_property = await self.enrich_property_data(full_property)
                        
                        properties.append(enriched_property)
                        
                        # Show enrichment in logs
                        badges_info = f" (Superhost)" if enriched_property.get("is_superhost") else ""
                        rating_info = ""
                        if enriched_property.get("host_reputation"):
                            rating = enriched_property["host_reputation"].get("average_rating", 0)
                            reviews = enriched_property["host_reputation"].get("total_reviews", 0)
                            if rating > 0:
                                rating_info = f" - {rating:.1f}⭐ ({reviews} reviews)"
                        
                        print(f"✅ Loaded property {property_id}: {metadata.get('title', 'Unknown')}{badges_info}{rating_info}")
                    else:
                        print(f"⚠️ Could not fetch IPFS metadata for property {property_id}")
                else:
                    print(f"⚠️ Property {property_id} not found or inactive")
                    
            except Exception as e:
                print(f"❌ Error loading property {property_id}: {e}")
                continue
        
        if not properties:
            print("⚠️ No properties found on blockchain. Attempting direct Pinata fetch...")
            properties = await self.fetch_from_pinata()
            
            if not properties:
                print("⚠️ No properties found on Pinata either.")
                return []
            
        return properties


# Singleton instance
blockchain_service = BlockchainService()
