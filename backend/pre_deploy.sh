#!/bin/bash

set -e  # Exit immediately if a command exits with a non-zero status

echo "Running pre-deployment checks..."

echo "1. Linting and code quality checks"
ruff check .

echo "2. Type checking"
mypy .

echo "3. Running tests"
pytest --cov=. --cov-report=html

echo "4. Security check"
bandit -r .

echo "5. Dependency vulnerability check"
safety check

echo "6. Freezing dependencies"
pip freeze > requirements.txt

echo "8. Compiling Python files"
python -m compileall .

echo "9. Checking environment variables"
# Add your own check here, e.g., checking if certain env vars are set

echo "10. Updating documentation"
# Add your own command to update documentation if applicable

echo "All pre-deployment checks completed successfully!"
