#!/usr/bin/env python3
"""
Delete ALL dummy properties from Render PostgreSQL database
This will clear the 9 test properties so only real blockchain data is used
"""
import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text
import os
from dotenv import load_dotenv

load_dotenv()

async def delete_all_properties():
    """Delete all properties from the database"""
    
    database_url = os.getenv("DATABASE_URL")
    
    if not database_url:
        print("❌ DATABASE_URL not found!")
        return
    
    print(f"🔗 Connecting to Render PostgreSQL database...")
    
    # Create async engine
    engine = create_async_engine(database_url, echo=False)
    
    try:
        async with engine.begin() as conn:
            # Check current count
            result = await conn.execute(text("SELECT COUNT(*) FROM property_embeddings"))
            count = result.scalar()
            
            print(f"\n📊 Current properties in database: {count}")
            
            if count == 0:
                print("✅ Database is already clean - no dummy data!")
                return
            
            # Show sample data
            print("\n📋 Sample dummy data that will be deleted:")
            result = await conn.execute(
                text("SELECT property_id, title, metadata->>'location_city' as city FROM property_embeddings LIMIT 5")
            )
            rows = result.fetchall()
            for row in rows:
                print(f"  - ID: {row[0]}, Title: {row[1]}, City: {row[2]}")
            
            print(f"\n⚠️  DELETING {count} dummy properties from Render database...")
            
            # Delete all rows
            await conn.execute(text("DELETE FROM property_embeddings"))
            
            # Verify deletion
            result = await conn.execute(text("SELECT COUNT(*) FROM property_embeddings"))
            remaining = result.scalar()
            
            print(f"\n✅ DELETED {count - remaining} properties")
            print(f"📊 Properties remaining: {remaining}")
            
        print("\n🎉 Database cleaned successfully!")
        print("\n💡 What's next:")
        print("   1. Restart your backend server")
        print("   2. Chat searches will now return 'No properties found' (correct!)")
        print("   3. When you add REAL properties to blockchain, run:")
        print("      curl -X POST http://localhost:8000/api/index")
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        print("\nIf you get a connection error, make sure:")
        print("  - DATABASE_URL is correct in .env")
        print("  - Render database allows your IP")
        print("  - sqlalchemy is installed: pip install sqlalchemy asyncpg")
    finally:
        await engine.dispose()

if __name__ == "__main__":
    print("="*60)
    print("  CLEAR DUMMY DATA FROM RENDER POSTGRESQL")
    print("="*60)
    asyncio.run(delete_all_properties())
