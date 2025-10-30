from contextlib import asynccontextmanager
from datetime import datetime
from typing import Any, AsyncGenerator, Dict

import aiohttp
import psutil
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger
from fastapi import BackgroundTasks, FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

from app.config import settings
from app.routers import channels, dates, epg, nownext, sources, transmitters, xmlepg

limiter = Limiter(key_func=get_remote_address)
scheduler = AsyncIOScheduler()

# Function to process sources
async def process_sources_task() -> None:
    async with aiohttp.ClientSession() as session:
        await sources.process_all_sources(session)

# async def process_foxtel_sources() -> None:
#     async with aiohttp.ClientSession() as session:
#         await foxtel.process_all_channels(session)


async def process_xmlepg_task() -> None:
    await xmlepg.process_epg()

# async def process_optus_task() -> None:
#     await optus.process_all_data()


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """
    Lifespan context manager for FastAPI application.
    Handles startup and shutdown events, including scheduler initialization.
    """
    # Startup: Configure and start the scheduler
    scheduler.add_job(
        process_sources_task,
        trigger=IntervalTrigger(hours=3),
        id='process_sources',
        name='Process XMLTV sources every 3 hours',
        replace_existing=True,
    )

    # scheduler.add_job(
    #     process_foxtel_sources,
    #     trigger=IntervalTrigger(hours=6),
    #     id="process_foxtel_sources",
    #     name="Process Foxtel sources every 6 hours",
    #     replace_existing=True,
    # )

    scheduler.add_job(
        process_xmlepg_task,
        trigger=IntervalTrigger(hours=12),
        id="process_xmlepg",
        name="Process XMLEPG every 12 hours",
        replace_existing=True,
    )

    # scheduler.add_job(
    #     process_optus_task,
    #     trigger=IntervalTrigger(hours=12),
    #     id="process_optus",
    #     name="Process Optus Sport every 12 hours",
    #     replace_existing=True,
    # )

    scheduler.start()
    
    yield
    
    # Shutdown: Stop the scheduler
    scheduler.shutdown()


app = FastAPI(
    title=settings.APP_NAME,
    docs_url="/api/py/docs",
    openapi_url="/api/py/openapi.json",
    lifespan=lifespan,
)

# Configure app state and middleware after app creation
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)  # type: ignore

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(sources.router, prefix="/api", tags=["sources"])
app.include_router(channels.router, prefix="/api", tags=["channels"])
app.include_router(epg.router, prefix="/api", tags=["epg"])
app.include_router(dates.router, prefix="/api", tags=["dates"])
app.include_router(nownext.router, prefix="/api/py/epg/nownext", tags=["nownext"])
# app.include_router(foxtel.router, prefix="/api", tags=["foxtel"])
# app.include_router(optus.router, prefix="/api", tags=["optus"])
app.include_router(transmitters.router, prefix="/api", tags=["transmitters"])
app.include_router(xmlepg.router, prefix="/api", tags=["xmlepg"])

# Mount static files
app.mount("/xmltvdata", StaticFiles(directory="xmltvdata"), name="xmltvdata")


@app.get("/")
@limiter.limit("5/minute")
async def root(request: Request) -> Dict[str, str]:
    return {"message": "Welcome to the FastAPI XMLTV App"}

@app.get("/api/py/health")
@limiter.limit("10/minute")
async def health_check(request: Request) -> Dict[str, Any]:
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
async def trigger_process_sources(
    request: Request, background_tasks: BackgroundTasks
) -> JSONResponse:
    result = await sources.process_sources(background_tasks)
    return JSONResponse(content=result)

# @app.get("/api/py/trigger-optus-sources")
# @limiter.limit("1/minute")
# async def trigger_optus_sources(
#     request: Request, background_tasks: BackgroundTasks
# ) -> JSONResponse:
#     return await optus.process_sources(background_tasks)


# Add this endpoint to get Foxtel process status
# @app.get("/api/optus-process-status")
# @limiter.limit("10/minute")
# async def get_optus_process_status(request: Request):
#     return optus.process_status


# Endpoint to manually trigger XMLEPG processing
@app.get("/api/py/trigger-xmlepg-process")
@limiter.limit("1/minute")
async def trigger_xmlepg_process(
    request: Request, background_tasks: BackgroundTasks
) -> JSONResponse:
    result = await xmlepg.process_epg()
    return JSONResponse(content=result)


# # Endpoint to get XMLEPG process status
# @app.get("/api/xmlepg-process-status")
# @limiter.limit("10/minute")
# async def get_xmlepg_process_status(request: Request):
#     return xmlepg.process_status
