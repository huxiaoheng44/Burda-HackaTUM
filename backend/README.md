# News Aggregator Backend

FastAPI-based backend for the news aggregator application.

## Features

- Periodic RSS feed fetching
- SQLite database storage
- RESTful API endpoints
- Automatic scheduling
- Error logging
- CORS support

## Setup

1. Create a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Configure environment variables:
   Copy `.env.example` to `.env` and adjust values as needed.

4. Run the application:
   ```bash
   uvicorn src.main:app --reload
   ```

## API Endpoints

- `GET /health`: Health check
- `GET /news`: Get all news articles
- `GET /news/{id}`: Get specific article
- `POST /news/{id}/view`: Increment article views
- `POST /news/{id}/share`: Increment article shares
- `POST /fetch-news`: Manually trigger RSS fetch

## Project Structure

```
backend/
├── src/
│   ├── app/
│   │   ├── models.py      # Database models
│   │   ├── schemas.py     # Pydantic schemas
│   │   ├── database.py    # Database configuration
│   │   ├── feed_fetcher.py # RSS feed fetcher
│   │   └── scheduler.py   # Periodic task scheduler
│   └── main.py           # FastAPI application
├── data/                 # SQLite database
├── logs/                 # Application logs
└── requirements.txt      # Python dependencies
```