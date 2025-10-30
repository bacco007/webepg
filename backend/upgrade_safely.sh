#!/bin/bash
# Safe package upgrade script for webepg backend using uv

set -e

echo "=========================================="
echo "Safe Package Upgrade Helper (uv)"
echo "=========================================="
echo ""

# Check if uv is installed
if ! command -v uv &> /dev/null; then
    echo "❌ Error: uv is not installed!"
    echo "   Install it with: curl -LsSf https://astral.sh/uv/install.sh | sh"
    exit 1
fi

echo "✅ Using uv: $(uv --version)"
echo ""

# Step 1: Show what's outdated
echo "Step 1: Checking for outdated packages..."
echo "------------------------------------------"

# Use uv pip list --outdated (uv supports pip commands)
OUTDATED_COUNT=$(uv pip list --outdated 2>/dev/null | grep -v "^Package" | grep -v "^---" | wc -l | tr -d ' ')

if [ "$OUTDATED_COUNT" -eq 0 ]; then
    echo "✅ All packages are up to date!"
else
    echo "Found $OUTDATED_COUNT outdated packages:"
    uv pip list --outdated 2>/dev/null | head -20
fi
echo ""

# Step 2: Backup current state
echo "Step 2: Creating backups..."
echo "------------------------------------------"

# Backup pyproject.toml and uv.lock
if [ -f "pyproject.toml" ]; then
    cp pyproject.toml pyproject.toml.backup
    echo "✓ Created backup: pyproject.toml.backup"
fi

if [ -f "uv.lock" ]; then
    cp uv.lock uv.lock.backup
    echo "✓ Created backup: uv.lock.backup"
fi

if [ -f "requirements.txt" ]; then
    cp requirements.txt requirements.txt.backup
    echo "✓ Created backup: requirements.txt.backup (legacy)"
fi

echo ""

# Step 3: Show safe upgrades (patch and minor only)
echo "Step 3: Analyzing safe upgrades..."
echo "------------------------------------------"

# Use Python to analyze version differences
python3 << 'EOF' 2>/dev/null || echo "  (Python analysis unavailable - showing all outdated packages)"
import json
import subprocess
import sys
from packaging import version

try:
    # Get outdated packages in JSON format
    result = subprocess.run(
        ["uv", "pip", "list", "--outdated", "--format", "json"],
        capture_output=True,
        text=True,
        timeout=30
    )
    
    if result.returncode != 0 or not result.stdout:
        print("  Could not fetch outdated packages")
        sys.exit(0)
    
    packages = json.loads(result.stdout)
    
    patch_upgrades = []
    minor_upgrades = []
    major_upgrades = []
    
    for pkg in packages:
        current = pkg.get('version', '')
        latest = pkg.get('latest_version', '')
        name = pkg.get('name', '')
        
        if not current or not latest or not name:
            continue
        
        try:
            v_curr = version.parse(current)
            v_lat = version.parse(latest)
            
            if v_curr.major == v_lat.major:
                if v_curr.minor == v_lat.minor:
                    patch_upgrades.append((name, current, latest))
                else:
                    minor_upgrades.append((name, current, latest))
            else:
                major_upgrades.append((name, current, latest))
        except:
            pass
    
    if patch_upgrades:
        print("Patch updates (safest - same major.minor):")
        for name, curr, lat in sorted(patch_upgrades)[:15]:
            print(f"  {name}: {curr} -> {lat}")
    
    if minor_upgrades:
        print(f"\nMinor updates (review recommended):")
        for name, curr, lat in sorted(minor_upgrades)[:10]:
            print(f"  {name}: {curr} -> {lat}")
    
    if major_upgrades:
        print(f"\n⚠️  Major updates (breaking changes likely):")
        for name, curr, lat in sorted(major_upgrades)[:10]:
            print(f"  {name}: {curr} -> {lat}")
        print(f"  ... and {len(major_upgrades) - 10} more" if len(major_upgrades) > 10 else "")
    
    print(f"\nSummary: {len(patch_upgrades)} patch, {len(minor_upgrades)} minor, {len(major_upgrades)} major updates")
    
except Exception as e:
    print(f"  Error analyzing packages: {e}")
    sys.exit(0)
EOF

echo ""

# Step 4: Show upgrade options
echo "=========================================="
echo "Upgrade Options:"
echo "=========================================="
echo ""
echo "1. Upgrade lock file to latest compatible versions:"
echo "   uv lock --upgrade && uv sync"
echo ""
echo "2. Upgrade a specific package:"
echo "   uv add --upgrade <package-name>"
echo ""
echo "3. Check what would change without applying:"
echo "   uv lock --upgrade --check"
echo ""
echo "4. Export to requirements.txt (for legacy compatibility):"
echo "   uv export --format requirements-txt --output-file requirements.txt"
echo ""

# Step 5: Interactive upgrade option
echo "=========================================="
echo "Interactive Upgrade"
echo "=========================================="
echo ""
read -p "Would you like to upgrade all packages now? (y/N): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo "Upgrading packages..."
    echo "------------------------------------------"
    
    # Upgrade using uv lock --upgrade (preserves pyproject.toml constraints)
    uv lock --upgrade
    
    # Sync the updated dependencies
    uv sync
    
    echo ""
    echo "✅ Upgrade complete!"
    echo ""
    echo "Next steps:"
    echo "1. Review changes: git diff pyproject.toml uv.lock"
    echo "2. Test your application: uv run python main.py"
    echo "3. Run your tests"
    echo "4. If everything works, commit: git add pyproject.toml uv.lock"
else
    echo ""
    echo "Manual upgrade recommended."
    echo "Review the outdated packages above and upgrade selectively:"
    echo "  uv add --upgrade <package-name>"
fi

echo ""
echo "=========================================="
echo "Backups created:"
echo "=========================================="
ls -lh *.backup 2>/dev/null | awk '{print "  " $9 " (" $5 ")"}' || echo "  No backups found"
echo ""
