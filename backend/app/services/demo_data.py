"""
Demo Data for StackNStay
Fallback data to ensure the live demo works even without blockchain connection
"""

DEMO_PROPERTIES = [
    {
        "property_id": 101,
        "title": "Luxury Oceanfront Villa in Tulum",
        "description": "Experience the ultimate relaxation in this stunning oceanfront villa. Featuring private beach access, infinity pool, and modern Mayan-inspired architecture. Perfect for a getaway.",
        "location_city": "Tulum",
        "location_country": "Mexico",
        "price_per_night": 450,
        "max_guests": 8,
        "bedrooms": 4,
        "bathrooms": 5,
        "amenities": ["Wifi", "Pool", "Beach Access", "Air Conditioning", "Chef's Kitchen"],
        "images": ["ipfs://QmTulumVilla"],
        "owner": "SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKQ9H6DPR",
        "is_superhost": True,
        "host_reputation": {
            "average_rating": 4.9,
            "total_reviews": 124
        }
    },
    {
        "property_id": 102,
        "title": "Modern Loft in Downtown Tokyo",
        "description": "Sleek and spacious loft in the heart of Shibuya. Walking distance to the famous crossing, best restaurants, and nightlife. High-speed internet and workspace included.",
        "location_city": "Tokyo",
        "location_country": "Japan",
        "price_per_night": 200,
        "max_guests": 2,
        "bedrooms": 1,
        "bathrooms": 1,
        "amenities": ["Wifi", "Workspace", "City View", "Smart TV", "Washer/Dryer"],
        "images": ["ipfs://QmTokyoLoft"],
        "owner": "SP1TEDTQZ4D596BF1Z24C5Q7A44F26C4115F369",
        "is_superhost": False,
        "host_reputation": {
            "average_rating": 4.7,
            "total_reviews": 45
        }
    },
    {
        "property_id": 103,
        "title": "Cozy Alpine Chalet",
        "description": "Charming wooden chalet with breathtaking mountain views. Ski-in/ski-out access, fireplace, and hot tub. Ideal for winter sports enthusiasts.",
        "location_city": "Zermatt",
        "location_country": "Switzerland",
        "price_per_night": 350,
        "max_guests": 6,
        "bedrooms": 3,
        "bathrooms": 2,
        "amenities": ["Wifi", "Fireplace", "Hot Tub", "Ski Storage", "Mountain View"],
        "images": ["ipfs://QmSwissChalet"],
        "owner": "SP3K8BC0PPEVCV7NZ6QSRWPQ2JE9E5B6E3PA0KBR9",
        "is_superhost": True,
        "host_reputation": {
            "average_rating": 5.0,
            "total_reviews": 89
        }
    },
    {
        "property_id": 104,
        "title": "Historic Apartment in Rome",
        "description": "Stay in a 17th-century building steps away from the Pantheon. Authentically restored with modern comforts. High ceilings and terracotta floors.",
        "location_city": "Rome",
        "location_country": "Italy",
        "price_per_night": 180,
        "max_guests": 4,
        "bedrooms": 2,
        "bathrooms": 1,
        "amenities": ["Wifi", "Air Conditioning", "Kitchen", "Central Location", "Elevator"],
        "images": ["ipfs://QmRomeApt"],
        "owner": "SP2M63YGBZCTWBWBCG77RET0RMP42C08TZE79X23",
        "is_superhost": True,
        "host_reputation": {
            "average_rating": 4.8,
            "total_reviews": 210
        }
    },
    {
        "property_id": 105,
        "title": "Beachfront Condo in Miami",
        "description": "Bright and airy condo with direct ocean views. Access to building gym and pool. Close to South Beach nightlife and dining.",
        "location_city": "Miami",
        "location_country": "USA",
        "price_per_night": 300,
        "max_guests": 4,
        "bedrooms": 2,
        "bathrooms": 2,
        "amenities": ["Wifi", "Pool", "Gym", "Ocean View", "Parking"],
        "images": ["ipfs://QmMiamiCondo"],
        "owner": "SP3QJ78M63YGBZCTWBWBCG77RET0RMP42C08TZE7",
        "is_superhost": False,
        "host_reputation": {
            "average_rating": 4.5,
            "total_reviews": 32
        }
    }
]
