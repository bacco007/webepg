"""Request/response logging middleware."""

import logging
import time
from collections.abc import Awaitable, Callable

from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response

logger = logging.getLogger(__name__)


class LoggingMiddleware(BaseHTTPMiddleware):
    """Middleware for logging HTTP requests and responses."""

    async def dispatch(
        self, request: Request, call_next: Callable[[Request], Awaitable[Response]]
    ) -> Response:
        """Log request and response details."""
        start_time = time.time()

        # Log request
        logger.info(
            f"{request.method} {request.url.path} - "
            f"Client: {request.client.host if request.client else 'unknown'}"
        )

        # Process request
        try:
            response = await call_next(request)
            process_time = time.time() - start_time

            # Log successful response
            logger.info(
                f"{request.method} {request.url.path} - "
                f"Status: {response.status_code} - "
                f"Time: {process_time:.3f}s"
            )

            return response

        except Exception as e:
            process_time = time.time() - start_time
            logger.error(
                f"{request.method} {request.url.path} - "
                f"Error: {type(e).__name__}: {str(e)} - "
                f"Time: {process_time:.3f}s",
                exc_info=True,
            )
            raise

