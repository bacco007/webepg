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

# Copy dependency files first for better caching
COPY pyproject.toml uv.lock ./

# Install dependencies using uv with BuildKit cache mount for faster rebuilds
# Use --no-cache to ensure clean installs
RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync --frozen --no-dev --no-cache

# Copy the rest of the application code
# This layer changes more frequently, so it's kept separate for better caching
COPY . .

# Ensure xmltvdata directory structure exists with proper permissions
RUN mkdir -p xmltvdata/remote xmltvdata/local xmltvdata/logos xmltvdata/settings xmltvdata/transmitters && \
    chmod -R 755 xmltvdata

# Create non-root user and set ownership (recommended for production)
RUN useradd -m -u 1000 appuser && \
    chown -R appuser:appuser /app

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
# FastAPI CLI uses module:app format (main:app where 'app' is the FastAPI instance)
# Using sh -c allows environment variable substitution in exec form
CMD ["sh", "-c", "uv run fastapi run main:app --host ${HOST:-0.0.0.0} --port ${PORT:-8000}"]