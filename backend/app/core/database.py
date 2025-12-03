from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.pool import NullPool

from app.core.config import settings
from sqlalchemy.orm import declarative_base

# Create declarative base
Base = declarative_base()

# Create async engine
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=settings.DB_ECHO,
    future=True,
    pool_size=settings.DB_POOL_SIZE,
    max_overflow=settings.DB_MAX_OVERFLOW,
    pool_recycle=settings.DB_POOL_RECYCLE,
)

# Create async session factory
AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """
    Dependency for getting async database sessions.

    Usage in FastAPI routes:
        @router.get("/")
        async def route(db: AsyncSession = Depends(get_db)):
            # Use db here
            pass
    """
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def init_db() -> None:
    """
    Initialize database - create all tables.

    Call this on application startup.
    For production, use Alembic migrations instead!
    """
    async with engine.begin() as conn:
        # Import all models to ensure they're registered with Base.metadata
        from app.models.property import Property
        from app.models.booking import Booking
        from app.models.review import Review
        from app.models.dispute import Dispute
        from app.models.blockchain import BlockchainSync, IPFSMetadata

        # Create all tables
        await conn.run_sync(Base.metadata.create_all)
        print("✓ Database tables created successfully")
        print(f"  - Properties")
        print(f"  - Bookings")
        print(f"  - Reviews")
        print(f"  - Disputes")
        print(f"  - BlockchainSync")
        print(f"  - IPFSMetadata")


async def drop_db() -> None:
    """
    Drop all database tables.

    ⚠️ DANGER: Only use this in development/testing!
    """
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        print("✓ Database tables dropped")


async def close_db() -> None:
    """
    Close database connections.

    Call this on application shutdown.
    """
    await engine.dispose()
    print("✓ Database connections closed")


# For testing purposes - create a separate test database session
async def get_test_db() -> AsyncGenerator[AsyncSession, None]:
    """
    Test database session.
    Uses TEST_DATABASE_URL if available, otherwise uses main DATABASE_URL.
    """
    test_engine = create_async_engine(
        settings.TEST_DATABASE_URL or settings.DATABASE_URL,
        echo=False,
        poolclass=NullPool,  # Don't pool connections in tests
    )

    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async_session = async_sessionmaker(
        test_engine,
        class_=AsyncSession,
        expire_on_commit=False,
    )

    async with async_session() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()

    # Cleanup
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)