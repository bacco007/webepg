#!/usr/bin/env python3
"""
Convert requirements.txt to pyproject.toml [project] dependencies.
This script helps migrate from pip to uv.
"""

import re
from pathlib import Path
from typing import List


def parse_requirements_txt(requirements_path: Path) -> List[str]:
    """Parse requirements.txt and return list of dependencies."""
    dependencies = []
    
    if not requirements_path.exists():
        print(f"❌ {requirements_path} not found")
        return dependencies
    
    with open(requirements_path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            # Skip empty lines and comments
            if not line or line.startswith("#"):
                continue
            
            # Skip options/flags
            if line.startswith("-"):
                continue
            
            # Handle editable installs
            if line.startswith("-e "):
                line = line[3:]
            
            dependencies.append(line)
    
    return dependencies


def update_pyproject_toml(pyproject_path: Path, dependencies: List[str]) -> None:
    """Update pyproject.toml with project dependencies."""
    import tomllib
    import tomli_w  # type: ignore
    
    # Read existing pyproject.toml
    if pyproject_path.exists():
        with open(pyproject_path, "rb") as f:
            try:
                data = tomllib.load(f)
            except Exception as e:
                print(f"⚠️  Error reading pyproject.toml: {e}")
                print("   Creating new structure...")
                data = {}
    else:
        data = {}
    
    # Ensure [project] section exists
    if "project" not in data:
        data["project"] = {}
    
    # Set basic project info if not present
    if "name" not in data["project"]:
        data["project"]["name"] = "webepg-backend"
    if "version" not in data["project"]:
        data["project"]["version"] = "1.0.0"
    if "description" not in data["project"]:
        data["project"]["description"] = "WebEPG FastAPI Backend"
    if "requires-python" not in data["project"]:
        data["project"]["requires-python"] = ">=3.10"
    
    # Update dependencies
    data["project"]["dependencies"] = dependencies
    
    # Write back to file
    with open(pyproject_path, "wb") as f:
        tomli_w.dump(data, f)
    
    print(f"✅ Updated {pyproject_path}")


def main():
    """Main conversion function."""
    project_root = Path(__file__).parent.parent
    requirements_path = project_root / "requirements.txt"
    pyproject_path = project_root / "pyproject.toml"
    
    print("Converting requirements.txt to pyproject.toml...")
    print("")
    
    # Parse requirements.txt
    dependencies = parse_requirements_txt(requirements_path)
    
    if not dependencies:
        print("❌ No dependencies found in requirements.txt")
        return
    
    print(f"Found {len(dependencies)} dependencies")
    print("")
    
    # Update pyproject.toml
    try:
        update_pyproject_toml(pyproject_path, dependencies)
        print("")
        print("✅ Conversion complete!")
        print("")
        print("Next steps:")
        print("1. Review pyproject.toml")
        print("2. Run: uv sync")
        print("3. Test: uv run python main.py")
    except ImportError as e:
        print(f"❌ Missing dependency: {e}")
        print("   Install with: pip install tomli tomli-w")
        print("   Or use uv: uv pip install tomli tomli-w")


if __name__ == "__main__":
    main()

