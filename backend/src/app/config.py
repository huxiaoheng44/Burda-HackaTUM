import os
from pathlib import Path

# Base directory
BASE_DIR = Path(__file__).resolve().parent.parent.parent

# Data directory
DATA_DIR = BASE_DIR / "data"
DATA_DIR.mkdir(exist_ok=True)

# Logs directory
LOGS_DIR = BASE_DIR / "logs"
LOGS_DIR.mkdir(exist_ok=True)

# Database
DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite+aiosqlite:///{DATA_DIR}/news.db")

# API settings
API_HOST = os.getenv("API_HOST", "0.0.0.0")
API_PORT = int(os.getenv("API_PORT", "3000"))
API_RELOAD = os.getenv("API_RELOAD", "true").lower() == "true"

# RSS Feed settings
RSS_UPDATE_INTERVAL = int(os.getenv("RSS_UPDATE_INTERVAL", "3600"))  # 1 hour in seconds
RSS_FETCH_TIMEOUT = int(os.getenv("RSS_FETCH_TIMEOUT", "30"))  # 30 seconds