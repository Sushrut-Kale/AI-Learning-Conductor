"""
config.py — Centralised configuration for AI Learning Conductor backend.

All environment variables are read here. Import from this module
rather than calling os.getenv() scattered throughout the codebase.
"""
import os
from typing import List

# Load .env file if present (development convenience)
# In production, environment variables should be injected by the platform
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass  # python-dotenv not installed — use system env vars directly


# ─────────────────────────────────────────────
# Core environment
# ─────────────────────────────────────────────

ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
IS_PRODUCTION: bool = ENVIRONMENT == "production"

# ─────────────────────────────────────────────
# Demo mode
# ─────────────────────────────────────────────

# When DEMO_MODE=true, the 30-student pre-seeded classroom is loaded on startup.
# When false, the system starts empty and expects real school records.
DEMO_MODE: bool = os.getenv("DEMO_MODE", "true").lower() in ("1", "true", "yes")

# ─────────────────────────────────────────────
# AI / Gemini
# ─────────────────────────────────────────────

GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")

# AI call settings
AI_TIMEOUT_SECONDS: float = float(os.getenv("AI_TIMEOUT_SECONDS", "12"))
AI_MAX_RETRIES: int = int(os.getenv("AI_MAX_RETRIES", "2"))
AI_MAX_OUTPUT_TOKENS: int = int(os.getenv("AI_MAX_OUTPUT_TOKENS", "400"))

# ─────────────────────────────────────────────
# CORS
# ─────────────────────────────────────────────

def _parse_cors_origins() -> List[str]:
    raw = os.getenv("CORS_ORIGINS", "http://localhost:3000,http://localhost:5173")
    return [o.strip() for o in raw.split(",") if o.strip()]

CORS_ORIGINS: List[str] = _parse_cors_origins()

# ─────────────────────────────────────────────
# Database
# ─────────────────────────────────────────────

DATABASE_URL: str = os.getenv(
    "DATABASE_URL",
    "sqlite:///./data/ai_learning_conductor.db"
)

# ─────────────────────────────────────────────
# Request limits
# ─────────────────────────────────────────────

MAX_REQUEST_SIZE_MB: int = int(os.getenv("MAX_REQUEST_SIZE_MB", "10"))

# ─────────────────────────────────────────────
# Logging
# ─────────────────────────────────────────────

LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO" if IS_PRODUCTION else "DEBUG")
