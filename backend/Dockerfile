# Use an official Python runtime as the parent image
# Pin to specific patch version for reproducibility
FROM python:3.12-slim

# Set environment variables for Python
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONOPTIMIZE=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

# Application runtime configuration (can be overridden)
ENV WORKERS=4 \
    HOST=0.0.0.0 \
    PORT=8000

# Set the working directory in the container
WORKDIR /app

# Install system dependencies and MySQL client
# Also install curl for healthcheck (lightweight alternative to requests)
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    default-libmysqlclient-dev \
    curl \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

# Install uv from official image (pin to specific version tag for reproducibility)
COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv
RUN chmod +x /usr/local/bin/uv

# Create non-root user first (needed for ownership changes)
RUN useradd -m -u 1000 appuser

# Copy dependency files first for better caching
COPY --chown=appuser:appuser pyproject.toml uv.lock ./

# Install dependencies using uv with BuildKit cache mount for faster rebuilds
# Use --no-cache to ensure clean installs
# Run as appuser to ensure .venv is owned by the correct user
USER appuser
RUN --mount=type=cache,target=/home/appuser/.cache/uv \
    uv sync --frozen --no-dev --no-cache
USER root

# Copy the rest of the application code
# This layer changes more frequently, so it's kept separate for better caching
COPY --chown=appuser:appuser . .

# Ensure xmltvdata directory structure exists with write permissions
# The app writes to xmltvdata/remote (XML files, JSON files, error logs)
# Ensure all files and directories in /app are owned by appuser (including .venv)
RUN mkdir -p xmltvdata/remote xmltvdata/local xmltvdata/logos xmltvdata/settings xmltvdata/transmitters && \
    chown -R appuser:appuser /app && \
    chmod -R 775 xmltvdata/remote xmltvdata/local

# Switch to non-root user
USER appuser

# Expose the port the app runs on
EXPOSE 8000

# Healthcheck using curl (no dependency on Python requests library)
# Uses the actual health endpoint from main.py
HEALTHCHECK --interval=30s --timeout=10s --retries=3 --start-period=40s \
    CMD curl -f http://localhost:8000/api/py/health || exit 1

# Add metadata labels (useful for container management)
LABEL maintainer="webepg-backend" \
      version="1.0.0" \
      description="WebEPG FastAPI Backend API"

# Define the command to run the app
# Using uv run ensures the virtual environment is properly activated
# uvicorn is the standard ASGI server for FastAPI in production
# Using sh -c allows environment variable substitution in exec form
CMD ["sh", "-c", "uv run uvicorn main:app --host ${HOST:-0.0.0.0} --port ${PORT:-8000} --workers ${WORKERS:-4}"]