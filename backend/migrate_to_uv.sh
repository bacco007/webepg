#!/bin/bash
# Migration script from pip/venv to uv
# This script helps automate the migration process

set -e

echo "=========================================="
echo "Migration to uv - Automated Setup"
echo "=========================================="
echo ""

# Step 1: Check if uv is installed
if ! command -v uv &> /dev/null; then
    echo "❌ uv is not installed!"
    echo ""
    echo "Please install uv first:"
    echo "  curl -LsSf https://astral.sh/uv/install.sh | sh"
    echo "  # or: brew install uv"
    exit 1
fi

echo "✅ uv is installed: $(uv --version)"
echo ""

# Step 2: Backup existing files
echo "Step 1: Creating backups..."
cp pyproject.toml pyproject.toml.backup 2>/dev/null || true
cp requirements.txt requirements.txt.backup 2>/dev/null || true
echo "✅ Backups created"
echo ""

# Step 3: Initialize uv project (if pyproject.toml has dependencies)
echo "Step 2: Initializing uv project..."
if [ -f "pyproject.toml" ] && grep -q "\[project\]" pyproject.toml; then
    echo "✅ pyproject.toml already has [project] section"
    uv sync --dev
else
    echo "⚠️  pyproject.toml needs [project] section"
    echo "   Please update pyproject.toml first (see UV_MIGRATION_GUIDE.md)"
    echo "   Or run: python scripts/convert_requirements_to_pyproject.py"
fi
echo ""

# Step 4: Generate lock file
echo "Step 3: Generating uv.lock file..."
if [ -f "pyproject.toml" ] && grep -q "\[project\]" pyproject.toml; then
    uv lock
    echo "✅ uv.lock generated"
else
    echo "⚠️  Skipping lock file generation (update pyproject.toml first)"
fi
echo ""

# Step 5: Verify installation
echo "Step 4: Verifying installation..."
if uv run python -c "import fastapi; print('FastAPI:', fastapi.__version__)" 2>/dev/null; then
    echo "✅ Dependencies installed correctly"
else
    echo "⚠️  Some dependencies may be missing"
fi
echo ""

# Step 6: Test application
echo "Step 5: Testing application startup..."
if uv run python -c "from main import app; print('✅ Application imports successfully')" 2>/dev/null; then
    echo "✅ Application can be imported"
else
    echo "⚠️  Application import check failed (this may be normal if dependencies are missing)"
fi
echo ""

echo "=========================================="
echo "Migration Summary"
echo "=========================================="
echo ""
echo "✅ Backups created:"
echo "   - pyproject.toml.backup"
echo "   - requirements.txt.backup"
echo ""
echo "Next steps:"
echo "1. Review updated pyproject.toml"
echo "2. Test your application: uv run python main.py"
echo "3. Update your scripts (pre_deploy.sh, upgrade_safely.sh)"
echo "4. Update Dockerfile"
echo ""
echo "For detailed instructions, see: UV_MIGRATION_GUIDE.md"
echo ""

