from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional


class Settings(BaseSettings):
    """
    StacksStay Application Settings
    Blockchain-enabled vacation rental platform
    """

    # Application
    APP_NAME: str = "StacksStay"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False

    # Database
    DATABASE_URL: str
    # postgresql+asyncpg://user:password@localhost:5432/stackstay

    TEST_DATABASE_URL: Optional[str] = None

    # Database connection pool settings
    DB_POOL_SIZE: int = 10  # Increased for indexer + API load
    DB_MAX_OVERFLOW: int = 20
    DB_POOL_RECYCLE: int = 3600
    DB_ECHO: bool = False

    # Stacks Blockchain
    STACKS_NETWORK: str = "testnet"  # or "mainnet"
    STACKS_API_URL: str = "https://api.testnet.hiro.so"
    STACKS_WS_URL: str = "wss://api.testnet.hiro.so"

    # Smart Contract Addresses (deployed contracts)
    CONTRACT_DEPLOYER: str  # e.g., "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM"
    ESCROW_CONTRACT: str = "stackstay-escrow"
    DISPUTES_CONTRACT: str = "stackstay-disputes"
    REPUTATION_CONTRACT: str = "stackstay-reputation"

    # Blockchain Indexer Settings
    INDEXER_START_BLOCK: int = 0  # Block to start indexing from
    INDEXER_POLL_INTERVAL: int = 10  # seconds between checks
    INDEXER_BATCH_SIZE: int = 50  # blocks per batch
    INDEXER_ENABLED: bool = True

    AUTH_CHALLENGE_EXPIRY: int = 300  # 5 minutes to complete auth
    SESSION_SECRET_KEY: str  # For signing JWTs
    SESSION_ALGORITHM: str = "HS256"
    SESSION_EXPIRE_HOURS: int = 24 * 7  # 1 week

    # IPFS Configuration
    IPFS_GATEWAY_URL: str = "https://gateway.pinata.cloud/ipfs"
    IPFS_API_URL: str = "https://api.pinata.cloud"
    PINATA_API_KEY: str
    PINATA_SECRET_KEY: str
    PINATA_JWT: Optional[str] = None  # Alternative auth method

    # ImageKit (for image transformation/CDN)
    IMAGEKIT_PRIVATE_KEY: str
    IMAGEKIT_PUBLIC_KEY: str
    IMAGEKIT_URL: str
    IMAGEKIT_FOLDER: str = "/stackstay"  # Organize uploads


    MESSAGE_SIGNING_DOMAIN: str = "stackstay.io"
    AUTH_MESSAGE_EXPIRY: int = 300


    # CORS
    CORS_ORIGINS: list[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:8080",
        "https://stackstay.io",
        "https://app.stackstay.io",
    ]
    CORS_ALLOW_CREDENTIALS: bool = True
    CORS_ALLOW_METHODS: list[str] = ["*"]
    CORS_ALLOW_HEADERS: list[str] = ["*"]

    # Pagination
    DEFAULT_PAGE_SIZE: int = 20
    MAX_PAGE_SIZE: int = 100

    # Search & Filtering
    SEARCH_MIN_QUERY_LENGTH: int = 2
    MAX_SEARCH_RESULTS: int = 1000

    # Platform Business Rules
    PLATFORM_FEE_BPS: int = 200  # 2% (matches contract)
    MIN_BOOKING_NIGHTS: int = 1
    MAX_BOOKING_NIGHTS: int = 365

    # Review/Rating Rules
    MIN_RATING: int = 1
    MAX_RATING: int = 5
    REVIEW_COMMENT_MAX_LENGTH: int = 500

    # Dispute Settings
    DISPUTE_EVIDENCE_MAX_LENGTH: int = 1000
    DISPUTE_AUTO_CLOSE_DAYS: int = 30

    # AI/RAG Configuration
    AI_ENABLED: bool = False
    GROQ_API_KEY: Optional[str] = None

    EMBEDDING_MODEL: str = "BAAI/bge-small-en-v1.5"
    VECTOR_DIMENSION: int = 384

    # Redis (for caching & rate limiting)
    REDIS_URL: Optional[str] = None  # redis://localhost:6379/0
    CACHE_ENABLED: bool = True
    CACHE_TTL: int = 300  # 5 minutes default

    # Rate Limiting
    RATE_LIMIT_ENABLED: bool = True
    RATE_LIMIT_REQUESTS: int = 100
    RATE_LIMIT_WINDOW: int = 60  # seconds

    # Monitoring & Logging
    LOG_LEVEL: str = "INFO"
    SENTRY_DSN: Optional[str] = None

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )


# Global settings instance
settings = Settings()


def get_settings() -> Settings:
    """Dependency injection for settings"""
    return settings