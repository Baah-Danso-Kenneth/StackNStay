#!/usr/bin/env python3
"""
Clear Dummy Data from PostgreSQL
This script removes ALL test/dummy property data from the database
"""
import asyncio
import asyncpg
import os
from dotenv import load_dotenv

load_dotenv()

async def clear_dummy_data():
    """Clear all property embeddings from PostgreSQL"""
    database_url = os.getenv("DATABASE_URL")
    
    if not database_url:
        print("❌ DATABASE_URL not found in environment")
        return
    
    # Strip +asyncpg suffix if present
    db_url = database_url.replace("postgresql+asyncpg://", "postgresql://")
    
    print("🔗 Connecting to PostgreSQL...")
    conn = await asyncpg.connect(db_url)
    
    try:
        # Check current count
        count_before = await conn.fetchval("SELECT COUNT(*) FROM property_embeddings")
        print(f"📊 Current properties in database: {count_before}")
        
        if count_before == 0:
            print("✅ Database is already clean!")
            return
        
        # Show sample data before deletion
        print("\n📋 Sample data to be deleted:")
        rows = await conn.fetch("SELECT property_id, title, metadata->'location_city' as city FROM property_embeddings LIMIT 5")
        for row in rows:
            print(f"  - ID: {row['property_id']}, Title: {row['title']}, City: {row['city']}")
        
        # Confirm deletion
        print(f"\n⚠️  About to DELETE {count_before} properties from database")
        response = input("Type 'YES' to confirm deletion: ")
        
        if response != "YES":
            print("❌ Deletion cancelled")
            return
        
        # Delete all rows
        await conn.execute("DELETE FROM property_embeddings")
        
        count_after = await conn.fetchval("SELECT COUNT(*) FROM property_embeddings")
        print(f"\n✅ Deleted {count_before - count_after} properties")
        print(f"📊 Properties remaining: {count_after}")
        
        print("\n🎉 Database cleaned successfully!")
        print("\n💡 Next steps:")
        print("   1. Restart the backend server")
        print("   2. Add real properties to blockchain")
        print("   3. Run: curl -X POST http://localhost:8000/api/index")
        
    finally:
        await conn.close()

if __name__ == "__main__":
    asyncio.run(clear_dummy_data())
