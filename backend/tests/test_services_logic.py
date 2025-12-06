import sys
from pathlib import Path

# Ensure the backend package (folder `backend`) is importable when tests run
ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

import pytest

from app.services.vector_store import VectorStore
from app.services.knowledge_store import KnowledgeStore


def test_create_property_text_includes_expected_fields():
    vs = VectorStore()

    prop = {
        "property_id": 42,
        "title": "Cozy Cottage",
        "location_city": "Accra",
        "location_country": "Ghana",
        "price_per_night": 120,
        "amenities": ["wifi", "kitchen"],
        "max_guests": 4,
        "bedrooms": 2,
        "bathrooms": 1,
        "description": "A lovely seaside cottage",
        "is_superhost": True,
        "host_badges": ["Top Host", "Fast Responder"],
        "host_reputation": {"average_rating": 4.8, "total_reviews": 128}
    }

    text = vs._create_property_text(prop)

    assert "Property: Cozy Cottage" in text
    assert "Location: Accra" in text
    assert "Country: Ghana" in text
    assert "Price: 120" in text
    assert "Amenities: wifi, kitchen" in text
    assert "Sleeps 4 guests" in text
    assert "2 bedrooms" in text
    assert "1 bathrooms" in text
    assert "Description: A lovely seaside cottage" in text
    assert "Superhost verified property" in text
    assert "Host achievements: Top Host, Fast Responder" in text
    assert "Host rating: 4.8" in text


def test_matches_filters_price_city_bedrooms_guests():
    vs = VectorStore()

    prop = {
        "property_id": 1,
        "title": "Nice Place",
        "location_city": "Kumasi",
        "location_country": "Ghana",
        "price_per_night": 85,
        "bedrooms": 1,
        "max_guests": 2,
        "description": "Comfortable and central",
    }

    # Price filters
    assert not vs._matches_filters(prop, {"min_price": 90})
    assert vs._matches_filters(prop, {"min_price": 50})
    assert vs._matches_filters(prop, {"max_price": 100})
    assert not vs._matches_filters(prop, {"max_price": 50})

    # City exact match (case-insensitive)
    assert vs._matches_filters(prop, {"city": "kumasi"})
    assert not vs._matches_filters(prop, {"city": "Accra"})

    # Bedrooms and guests
    assert vs._matches_filters(prop, {"bedrooms": 1})
    assert not vs._matches_filters(prop, {"bedrooms": 2})
    assert vs._matches_filters(prop, {"guests": 2})
    assert not vs._matches_filters(prop, {"guests": 3})

    # Location fuzzy match (matches title/description)
    assert vs._matches_filters(prop, {"location": "central"})
    assert not vs._matches_filters(prop, {"location": "beach"})


def test_split_into_chunks_simple_markdown():
    ks = KnowledgeStore()

    md = """
# Welcome

This is the intro paragraph.

## Getting Started

To get started, do X.

### Installation

Run the installer.

## Usage

Use the CLI to run commands.
"""

    chunks = ks._split_into_chunks(md)

    # Expect at least three meaningful chunks (Intro, Getting Started, Installation or Usage)
    assert any(c["title"].lower().startswith("getting started") for c in chunks)
    assert any(c["title"].lower().startswith("installation") for c in chunks)
    assert any("intro" in c["content"].lower() or "welcome" in c["title"].lower() for c in chunks)
