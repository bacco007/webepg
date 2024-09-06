from datetime import datetime

import aiohttp
import psutil
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger
from fastapi import BackgroundTasks, FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

from app.config import settings
from app.routers import channels, dates, epg, nownext, sources

limiter = Limiter(key_func=get_remote_address)
app = FastAPI(title=settings.APP_NAME, docs_url="/api/py/docs", openapi_url="/api/py/openapi.json")
scheduler = AsyncIOScheduler()

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(sources.router, prefix="/api", tags=["sources"])
app.include_router(channels.router, prefix="/api", tags=["channels"])
app.include_router(epg.router, prefix="/api", tags=["epg"])
app.include_router(dates.router, prefix="/api", tags=["dates"])
app.include_router(nownext.router, prefix="/api/py/epg/nownext", tags=["nownext"])

# Function to process sources
async def process_sources_task():
    async with aiohttp.ClientSession() as session:
        await sources.process_all_sources(session)

# Schedule the task to run every 3 hours
scheduler.add_job(
    process_sources_task,
    trigger=IntervalTrigger(hours=3),
    id='process_sources',
    name='Process XMLTV sources every 3 hours',
    replace_existing=True,
)

@app.on_event("startup")
async def startup_event():
    scheduler.start()

@app.on_event("shutdown")
async def shutdown_event():
    scheduler.shutdown()

@app.get("/")
@limiter.limit("5/minute")
async def root(request: Request):
    return {"message": "Welcome to the FastAPI XMLTV App"}

@app.get("/api/py/health")
@limiter.limit("10/minute")
async def health_check(request: Request):
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "app_name": settings.APP_NAME,
        "version": "1.0.0",  # You can update this with your actual version number
        "system_info": {
            "cpu_usage": psutil.cpu_percent(),
            "memory_usage": psutil.virtual_memory().percent,
            "disk_usage": psutil.disk_usage('/').percent
        }
    }

# Endpoint to manually trigger process_sources
@app.get("/api/py/trigger-process-sources")
@limiter.limit("1/minute")
async def trigger_process_sources(request: Request, background_tasks: BackgroundTasks):
    return await sources.process_sources(background_tasks)

# # Endpoint to get process status
# @app.get("/api/process-status")
# @limiter.limit("10/minute")
# async def get_process_status(request: Request):
#     return await sources.get_process_status()
