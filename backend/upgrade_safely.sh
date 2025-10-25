#!/bin/bash
# Safe package upgrade script for webepg backend

echo "=========================================="
echo "Safe Package Upgrade Helper"
echo "=========================================="
echo ""

# Step 1: Show what's outdated
echo "Step 1: Checking for outdated packages..."
echo "------------------------------------------"
pip list --outdated | grep -E "^[a-z].*" | awk '{print $1}' > /tmp/outdated_packages.txt
cat /tmp/outdated_packages.txt | head -20
echo ""

# Step 2: Create a new requirements file with current versions
echo "Step 2: Updating requirements.txt..."
echo "------------------------------------------"

# Backup original
cp requirements.txt requirements.txt.backup
echo "✓ Created backup: requirements.txt.backup"

# Generate list of safe upgrades (patch and minor only)
echo ""
echo "Step 3: Safe upgrades available"
echo "------------------------------------------"

# Show patch-level upgrades only
echo "Patch updates (safest):"
pip list --outdated --format=json 2>/dev/null | python3 -c "
import json, sys
from packaging import version

data = sys.stdin.read()
if not data:
    print('  No outdated packages found in JSON format')
    sys.exit(0)

try:
    packages = json.loads(data)
    for pkg in packages:
        current = pkg.get('version', '')
        latest = pkg.get('latest_version', '')
        if current and latest:
            try:
                v_curr = version.parse(current)
                v_lat = version.parse(latest)
                # Only show if major version matches
                if v_curr.major == v_lat.major:
                    print(f\"  {pkg['name']}: {current} -> {latest}\")
            except:
                pass
except Exception as e:
    print(f'Error: {e}')
" 2>/dev/null || echo "  (Run 'pip list --outdated' manually to see details)"

echo ""
echo "=========================================="
echo "Manual Steps:"
echo "=========================================="
echo "1. Review outdated packages: pip list --outdated"
echo "2. Test upgrades in a virtual environment first"
echo "3. Check changelogs for breaking changes"
echo "4. Run your tests after upgrading"
echo ""
echo "Recommended commands:"
echo "  pip install --upgrade <package-name>  # Upgrade one at a time"
echo "  pip install --upgrade pip             # Upgrade pip first"
echo ""
echo "Backup saved at: requirements.txt.backup"
