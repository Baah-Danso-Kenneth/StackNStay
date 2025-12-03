from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session
from app.models.property import Property
from datetime import datetime


class PropertySearchTool:
    """Tool for AI agent to search properties"""

    def __init__(self, db: Session):
        self.db = db

    def search_properties(
            self,
            city: Optional[str] = None,
            max_price: Optional[int] = None,
            min_bedrooms: Optional[int] = None,
            max_guests: Optional[int] = None,
            limit: int = 10
    ) -> List[Dict[str, Any]]:
        """
        Search properties based on filters
        Returns list of properties with details
        """
        query = self.db.query(Property).filter(Property.active == True)

        # Apply filters
        if city:
            query = query.filter(Property.location_city.ilike(f"%{city}%"))

        if max_price:
            query = query.filter(Property.price_per_night <= max_price)

        if min_bedrooms:
            query = query.filter(Property.bedrooms >= min_bedrooms)

        if max_guests:
            query = query.filter(Property.max_guests >= max_guests)

        # Execute query
        properties = query.limit(limit).all()

        # Format results for AI
        return [
            {
                "property_id": prop.blockchain_id,
                "title": prop.title,
                "city": prop.location_city,
                "country": prop.location_country,
                "price_per_night_stx": prop.price_per_night / 1_000_000,  # Convert to STX
                "bedrooms": prop.bedrooms,
                "bathrooms": prop.bathrooms,
                "max_guests": prop.max_guests,
                "description": prop.description[:200] + "..." if prop.description else ""
            }
            for prop in properties
        ]

    def get_property_details(self, property_id: int) -> Optional[Dict[str, Any]]:
        """Get full details for a specific property"""
        prop = self.db.query(Property).filter(
            Property.blockchain_id == property_id
        ).first()

        if not prop:
            return None

        return {
            "property_id": prop.blockchain_id,
            "title": prop.title,
            "description": prop.description,
            "city": prop.location_city,
            "country": prop.location_country,
            "price_per_night_stx": prop.price_per_night / 1_000_000,
            "bedrooms": prop.bedrooms,
            "bathrooms": prop.bathrooms,
            "max_guests": prop.max_guests,
            "owner_address": prop.owner_address,
            "active": prop.active
        }

    def calculate_booking_cost(
            self,
            property_id: int,
            num_nights: int
    ) -> Optional[Dict[str, Any]]:
        """Calculate total booking cost including fees"""
        prop = self.db.query(Property).filter(
            Property.blockchain_id == property_id
        ).first()

        if not prop:
            return None

        base_cost = (prop.price_per_night / 1_000_000) * num_nights
        platform_fee = base_cost * 0.02  # 2% fee
        total = base_cost + platform_fee

        return {
            "property_id": property_id,
            "num_nights": num_nights,
            "price_per_night_stx": prop.price_per_night / 1_000_000,
            "base_cost_stx": base_cost,
            "platform_fee_stx": platform_fee,
            "total_cost_stx": total
        }