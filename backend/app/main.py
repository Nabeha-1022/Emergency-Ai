"""
Emergency AI System — FastAPI Backend
Main application entry point.
"""

import logging
import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
# pyrefly: ignore [missing-import]
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)

# Import routes
from app.routes import auth, calls, analysis, operator, analytics, protocols
from app.services import db_service


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown lifecycle."""
    logger.info("🚀 Emergency AI System starting up...")
    await db_service.init_db()
    await db_service.seed_demo_data()
    logger.info("✅ Database ready")
    yield
    logger.info("🛑 Emergency AI System shutting down...")


app = FastAPI(
    title="Emergency AI System API",
    description="Human-AI Collaboration System for Emergency Call Centers",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS - allow frontend dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register all routers
app.include_router(auth.router)
app.include_router(calls.router)
app.include_router(analysis.router)
app.include_router(operator.router)
app.include_router(analytics.router)
app.include_router(protocols.router)


@app.get("/")
async def root():
    return {
        "message": "Emergency AI System API",
        "version": "1.0.0",
        "docs": "/docs",
        "status": "online",
    }


@app.get("/health")
async def health():
    return {
        "status": "healthy",
        "db_mode": "mongodb" if db_service.is_using_mongo() else "json",
    }
