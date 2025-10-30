# Migration Guide: venv/pip → uv

## Overview

This guide will help you migrate from the traditional `venv` + `pip` workflow to `uv`, a fast Python package installer and resolver written in Rust.

## Benefits of uv

- **10-100x faster** than pip for dependency resolution and installation
- **Drop-in replacement** for pip and venv commands
- **Automatic dependency resolution** with conflict detection
- **Built-in virtual environment management**
- **Lock file support** for reproducible builds
- **Native dependency resolution** (no need for pip-tools)

## Current State

- Using `requirements.txt` with 117+ pinned dependencies
- `venv` virtual environment (likely `.venv/`)
- `pip` for package management
- `Dockerfile` uses `pip install`
- Scripts (`pre_deploy.sh`, `upgrade_safely.sh`) use pip commands
- `pyproject.toml` exists but only contains tool configurations

## Migration Steps

### Step 1: Install uv

```bash
# On macOS/Linux
curl -LsSf https://astral.sh/uv/install.sh | sh

# Or via Homebrew
brew install uv

# Or via pip (temporary, for migration)
pip install uv
```

Verify installation:
```bash
uv --version
```

### Step 2: Update pyproject.toml

Convert your `requirements.txt` to `pyproject.toml` dependencies. uv can auto-detect Python version from your existing config.

Your `pyproject.toml` should be updated to include:

```toml
[project]
name = "webepg-backend"
version = "1.0.0"
description = "WebEPG FastAPI Backend"
requires-python = ">=3.10"
dependencies = [
    "aiohappyeyeballs==2.6.1",
    "aiohttp==3.13.1",
    # ... (all dependencies from requirements.txt)
]
```
 
### Step 3: Initialize uv Project

```bash
# Navigate to your backend directory
cd /Users/bacco007/Documents/webdev/webepg/backend

# Initialize uv project (this will sync dependencies)
uv sync
```

This will:
- Create a virtual environment if it doesn't exist
- Install all dependencies from `pyproject.toml`
- Generate `uv.lock` file for reproducible installs

### Step 4: Update .gitignore

Add uv-specific entries:

```gitignore
# uv
.uv/
uv.lock
```

**Note**: You should commit `uv.lock` to version control (unlike some other tools) for reproducible builds.

### Step 5: Update Development Workflow

#### Old way (venv/pip):
```bash
source .venv/bin/activate
pip install -r requirements.txt
python main.py
```

#### New way (uv):
```bash
# uv automatically manages the virtual environment
uv run python main.py

# Or activate manually if needed
source .venv/bin/activate  # uv creates standard venv
python main.py
```

### Step 6: Update Scripts

#### Update `pre_deploy.sh`:

Replace:
```bash
pip freeze > requirements.txt
```

With:
```bash
uv export --format requirements-txt --output-file requirements.txt --no-hashes
```

Or better yet, use `uv.lock` directly (no need to export requirements.txt).

#### Update `upgrade_safely.sh`:

Replace pip commands with uv equivalents:

```bash
# Old: pip list --outdated
uv pip list --outdated

# Old: pip install --upgrade <package>
uv pip install --upgrade <package>

# Sync all dependencies
uv sync --upgrade
```

### Step 7: Update Dockerfile

Replace pip-based installation with uv:

```dockerfile
# Install uv
COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv

# Install dependencies using uv
COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-dev

# Run the application
CMD ["uv", "run", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

Or multi-stage build for smaller images:

```dockerfile
FROM python:3.12-slim as builder

# Install uv
COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv

# Install dependencies
COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-dev

FROM python:3.12-slim

# Copy virtual environment from builder
COPY --from=builder /root/.venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

WORKDIR /app
COPY . .

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

## Command Reference

### Package Management

| Task | Old (pip) | New (uv) |
|------|-----------|----------|
| Install dependencies | `pip install -r requirements.txt` | `uv sync` |
| Add package | `pip install package` | `uv add package` |
| Remove package | `pip uninstall package` | `uv remove package` |
| Update package | `pip install --upgrade package` | `uv add --upgrade package` |
| List packages | `pip list` | `uv pip list` |
| Freeze | `pip freeze > requirements.txt` | `uv export` (or use `uv.lock`) |

### Virtual Environment

| Task | Old (venv) | New (uv) |
|------|------------|----------|
| Create venv | `python -m venv .venv` | `uv venv` (or `uv sync`) |
| Activate venv | `source .venv/bin/activate` | Same, or use `uv run` |
| Run script | `python script.py` | `uv run python script.py` |

### Development

```bash
# Run tests
uv run pytest

# Run application
uv run uvicorn main:app --reload

# Run linting
uv run ruff check .

# Type checking
uv run mypy .
```

## Migration Checklist

- [ ] Install uv
- [ ] Convert `requirements.txt` to `pyproject.toml` dependencies
- [ ] Run `uv sync` to create lock file
- [ ] Test that application runs: `uv run python main.py`
- [ ] Update `.gitignore` (add `uv.lock` is recommended to commit it)
- [ ] Update `pre_deploy.sh` script
- [ ] Update `upgrade_safely.sh` script
- [ ] Update `Dockerfile`
- [ ] Test Docker build
- [ ] Update CI/CD pipelines (if applicable)
- [ ] Document new workflow for team

## Troubleshooting

### Python Version Mismatch

If you see Python version errors:
```bash
# Specify Python version
uv python pin 3.10
uv sync
```

### Missing Dependencies

If some packages are missing:
```bash
# Sync will install everything from pyproject.toml
uv sync

# Or add missing packages
uv add missing-package
```

### Lock File Conflicts

If `uv.lock` has conflicts:
```bash
# Regenerate lock file
rm uv.lock
uv lock
```

## Recommended Next Steps

1. **Keep requirements.txt temporarily** - Some CI/CD systems might still need it
   ```bash
   uv export --format requirements-txt --output-file requirements.txt
   ```

2. **Update documentation** - Update any README or docs that reference pip/venv commands

3. **Team onboarding** - Share this guide with your team

4. **Monitor performance** - Enjoy the speed boost! 🚀

## Additional Resources

- [uv Documentation](https://docs.astral.sh/uv/)
- [uv GitHub](https://github.com/astral-sh/uv)
- [Migration Guide](https://docs.astral.sh/uv/pip/)

## Notes

- `uv.lock` should be committed to version control for reproducible builds
- `requirements.txt` can be kept for backward compatibility or can be generated on-demand
- uv is 100% compatible with pip - you can still use `uv pip install` if needed
- Virtual environments created by uv are standard Python venvs (compatible with existing tools)

