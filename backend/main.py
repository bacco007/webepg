from contextlib import asynccontextmanager
from datetime import datetime
from typing import Any, AsyncGenerator, Dict

import aiohttp
import psutil
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger
from fastapi import BackgroundTasks, FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

from app.config import settings
from app.exceptions import WebEPGException
from app.logging_config import setup_logging
from app.middleware.logging_middleware import LoggingMiddleware
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

@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """
    Lifespan context manager for FastAPI application.
    Handles startup and shutdown events, including scheduler initialization.
    """
    # Startup: Configure logging
    setup_logging(
        log_level=settings.LOG_LEVEL,
        log_file=settings.LOG_FILE,
    )
    
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
    description="""
    WebEPG API provides comprehensive Electronic Program Guide (EPG) data and channel information
    for Australian television and radio sources.
    
    ## Features
    
    * 📺 **Channel Data**: Retrieve channel information and metadata
    * 📅 **EPG Data**: Access program schedules by channel, date, or category
    * 📡 **Transmitters**: Query TV and radio transmitter information
    * 🔄 **Source Management**: Manage and process XMLTV sources
    * 📊 **Real-time Status**: Check source processing status and health
    
    ## API Documentation
    
    Interactive API documentation is available at `/api/py/docs` (Swagger UI) and `/api/py/redoc` (ReDoc).
    """,
    version="1.0.0",
    docs_url="/api/py/docs",
    redoc_url="/api/py/redoc",
    openapi_url="/api/py/openapi.json",
    lifespan=lifespan,
    tags_metadata=[
        {
            "name": "sources",
            "description": "Manage XMLTV sources, check status, and trigger processing tasks.",
        },
        {
            "name": "channels",
            "description": "Retrieve channel information and metadata for available sources.",
        },
        {
            "name": "epg",
            "description": "Access Electronic Program Guide data by channel, date, category (sports, movies), and timezone.",
        },
        {
            "name": "dates",
            "description": "Query available dates and programming schedules.",
        },
        {
            "name": "nownext",
            "description": "Get current and next program information.",
        },
        {
            "name": "transmitters",
            "description": "Query television and radio transmitter data with filtering options.",
        },
        {
            "name": "xmlepg",
            "description": "Process and manage XMLEPG data sources.",
        },
        {
            "name": "system",
            "description": "System health checks and utility endpoints.",
        },
    ],
)

# Configure app state and middleware after app creation
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)  # type: ignore

# Add logging middleware
app.add_middleware(LoggingMiddleware)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global exception handlers
@app.exception_handler(WebEPGException)
async def webepg_exception_handler(request: Request, exc: WebEPGException) -> JSONResponse:
    """Handle WebEPG custom exceptions."""
    return JSONResponse(
        status_code=exc.status_code,
        content=exc.to_dict(),
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(
    request: Request, exc: RequestValidationError
) -> JSONResponse:
    """Handle Pydantic validation errors."""
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "error": "Validation error",
            "error_type": "ValidationError",
            "error_code": "VALIDATION_ERROR",
            "status_code": status.HTTP_422_UNPROCESSABLE_ENTITY,
            "details": exc.errors(),
        },
    )


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Handle unexpected exceptions."""
    import logging

    logger = logging.getLogger(__name__)
    logger.error(
        f"Unhandled exception: {type(exc).__name__}: {str(exc)}",
        exc_info=True,
    )

    # Don't expose internal error details in production
    if settings.DEBUG:
        detail = f"Internal server error: {str(exc)}"
    else:
        detail = "An internal server error occurred. Please try again later."

    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": detail,
            "error_type": "InternalServerError",
            "error_code": "INTERNAL_SERVER_ERROR",
            "status_code": status.HTTP_500_INTERNAL_SERVER_ERROR,
        },
    )

# Include routers
app.include_router(sources.router, prefix="/api", tags=["sources"])
app.include_router(channels.router, prefix="/api", tags=["channels"])
app.include_router(epg.router, prefix="/api", tags=["epg"])
app.include_router(dates.router, prefix="/api", tags=["dates"])
app.include_router(nownext.router, prefix="/api/py/epg/nownext", tags=["nownext"])
# app.include_router(foxtel.router, prefix="/api", tags=["foxtel"])
app.include_router(transmitters.router, prefix="/api", tags=["transmitters"])
app.include_router(xmlepg.router, prefix="/api", tags=["xmlepg"])

# Mount static files
app.mount("/xmltvdata", StaticFiles(directory="xmltvdata"), name="xmltvdata")


@app.get(
    "/",
    tags=["system"],
    summary="API Root",
    description="Welcome endpoint providing basic API information.",
    response_description="Basic API welcome message",
)
@limiter.limit("5/minute")
async def root(request: Request) -> Dict[str, str]:
    """
    Root endpoint that returns a welcome message.
    
    Use this endpoint to verify the API is running and accessible.
    """
    return {"message": "Welcome to the FastAPI XMLTV App"}

@app.get(
    "/api/py/health",
    tags=["system"],
    summary="Health Check",
    description="Check the health and system status of the API.",
    response_description="Health status and system metrics",
    responses={
        200: {
            "description": "Service is healthy",
            "content": {
                "application/json": {
                    "example": {
                        "status": "healthy",
                        "timestamp": "2024-01-15T10:30:00.000000",
                        "app_name": "webEPG API",
                        "version": "1.0.0",
                        "system_info": {
                            "cpu_usage": 15.5,
                            "memory_usage": 45.2,
                            "disk_usage": 60.8
                        }
                    }
                }
            }
        }
    }
)
@limiter.limit("10/minute")
async def health_check(request: Request) -> Dict[str, Any]:
    """
    Health check endpoint providing system status and metrics.
    
    Returns:
        - **status**: Health status (always "healthy" if endpoint responds)
        - **timestamp**: Current server timestamp in ISO format
        - **app_name**: Application name
        - **version**: API version
        - **system_info**: System resource usage (CPU, memory, disk)
    
    Use this endpoint for:
    - Load balancer health checks
    - Monitoring system resource usage
    - Verifying API availability
    """
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "app_name": settings.APP_NAME,
        "version": "1.0.0",
        "system_info": {
            "cpu_usage": psutil.cpu_percent(),
            "memory_usage": psutil.virtual_memory().percent,
            "disk_usage": psutil.disk_usage('/').percent
        }
    }

@app.post(
    "/api/py/trigger-process-sources",
    tags=["sources"],
    summary="Trigger Source Processing",
    description="Manually trigger processing of all XMLTV sources in the background.",
    response_description="Processing task status",
    responses={
        200: {
            "description": "Processing task started successfully",
            "content": {
                "application/json": {
                    "example": {
                        "message": "Processing sources in the background",
                        "status": {
                            "is_running": True,
                            "start_time": "2024-01-15T10:30:00.000000",
                            "current_source": None,
                            "processed_sources": [],
                            "errors": []
                        }
                    }
                }
            }
        },
        429: {"description": "Rate limit exceeded"}
    }
)
@limiter.limit("1/minute")
async def trigger_process_sources(
    request: Request, background_tasks: BackgroundTasks
) -> JSONResponse:
    """
    Trigger background processing of all configured XMLTV sources.
    
    This endpoint:
    - Downloads XMLTV files from configured sources
    - Processes XML data into JSON format
    - Updates channel and program data files
    
    **Note**: Processing runs asynchronously. Check `/api/py/process-status` for progress.
    
    **Rate Limit**: 1 request per minute
    """
    result = await sources.process_sources(background_tasks)
    return JSONResponse(content=result)

# Add this endpoint to get Foxtel process status
# @app.get("/api/optus-process-status")
# @limiter.limit("10/minute")
# async def get_optus_process_status(request: Request):
#     return optus.process_status


@app.post(
    "/api/py/trigger-xmlepg-process",
    tags=["xmlepg"],
    summary="Trigger XMLEPG Processing",
    description="Manually trigger processing of XMLEPG data sources.",
    response_description="Processing task status",
    responses={
        200: {
            "description": "Processing task started successfully",
            "content": {
                "application/json": {
                    "example": {
                        "message": "XMLEPG processing initiated",
                        "status": {
                            "is_running": True,
                            "start_time": "2024-01-15T10:30:00.000000"
                        }
                    }
                }
            }
        },
        429: {"description": "Rate limit exceeded"}
    }
)
@limiter.limit("1/minute")
async def trigger_xmlepg_process(
    request: Request, background_tasks: BackgroundTasks
) -> JSONResponse:
    """
    Trigger processing of XMLEPG data sources.
    
    This endpoint processes XMLEPG provider data and updates the guide database.
    
    **Rate Limit**: 1 request per minute
    """
    result = await xmlepg.process_epg()
    return JSONResponse(content=result)


# # Endpoint to get XMLEPG process status
# @app.get("/api/xmlepg-process-status")
# @limiter.limit("10/minute")
# async def get_xmlepg_process_status(request: Request):
#     return xmlepg.process_status
