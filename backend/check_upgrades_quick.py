#!/usr/bin/env python3
"""
Quick script to check for upgradable packages and categorize them by risk level.
"""
import subprocess
import re

def get_outdated_packages() -> list[dict[str, str]]:
    """Get list of outdated packages"""
    result = subprocess.run(
        ["pip", "list", "--outdated"],
        capture_output=True,
        text=True
    )
    
    outdated = []
    lines = result.stdout.strip().split('\n')[2:]  # Skip header
    
    for line in lines:
        if line.strip():
            parts = line.split()
            if len(parts) >= 3:
                outdated.append({
                    'name': parts[0].lower(),
                    'current': parts[1].rstrip(','),
                    'latest': parts[-1]
                })
    
    return outdated

def categorize_upgrade(current: str, latest: str) -> str:
    """Categorize upgrade by risk level"""
    try:
        current_parts = current.split('.')
        latest_parts = latest.split('.')
        
        # Simple version comparison
        if len(current_parts) >= 3 and len(latest_parts) >= 3:
            curr_major = int(current_parts[0])
            curr_minor = int(current_parts[1])
            latest_major = int(latest_parts[0])
            latest_minor = int(latest_parts[1])
            
            if latest_major > curr_major:
                return "HIGH_RISK"  # Major version change
            elif latest_minor > curr_minor:
                return "MEDIUM_RISK"  # Minor version change
            else:
                return "LOW_RISK"  # Patch version change
    except (ValueError, IndexError):
        pass
    
    return "UNKNOWN"

def main() -> None:
    print("🔍 Checking for outdated packages...\n")
    
    outdated = get_outdated_packages()
    
    if not outdated:
        print("✅ All packages are up to date!")
        return
    
    # Categorize packages
    low_risk = []
    medium_risk = []
    high_risk = []
    unknown = []
    
    for pkg in outdated:
        risk = categorize_upgrade(pkg['current'], pkg['latest'])
        pkg['risk'] = risk
        
        if risk == "LOW_RISK":
            low_risk.append(pkg)
        elif risk == "MEDIUM_RISK":
            medium_risk.append(pkg)
        elif risk == "HIGH_RISK":
            high_risk.append(pkg)
        else:
            unknown.append(pkg)
    
    # Print results
    print(f"📦 Found {len(outdated)} outdated packages\n")
    
    if high_risk:
        print("🔴 HIGH RISK (Major version changes - breaking changes likely):")
        print("-" * 70)
        for pkg in high_risk[:10]:  # Show first 10
            print(f"  • {pkg['name']}: {pkg['current']} → {pkg['latest']}")
        if len(high_risk) > 10:
            print(f"  ... and {len(high_risk) - 10} more")
        print()
    
    if medium_risk:
        print("🟡 MEDIUM RISK (Minor version changes - test recommended):")
        print("-" * 70)
        for pkg in medium_risk[:10]:
            print(f"  • {pkg['name']}: {pkg['current']} → {pkg['latest']}")
        if len(medium_risk) > 10:
            print(f"  ... and {len(medium_risk) - 10} more")
        print()
    
    if low_risk:
        print("🟢 LOW RISK (Patch changes - generally safe to upgrade):")
        print("-" * 70)
        for pkg in low_risk[:10]:
            print(f"  • {pkg['name']}: {pkg['current']} → {pkg['latest']}")
        if len(low_risk) > 10:
            print(f"  ... and {len(low_risk) - 10} more")
        print()
    
    # Recommendations
    print("=" * 70)
    print("\n💡 Recommendations:")
    
    if low_risk:
        print(f"\n✅ SAFE TO UPGRADE ({len(low_risk)} packages):")
        print("   These are patch versions and should be safe to upgrade.")
        print("   Command: pip install --upgrade <package-name>")
        
        print("\n   Quick upgrade command for safe packages:")
        safe_packages = " ".join([pkg['name'] for pkg in low_risk[:5]])
        print(f"   pip install --upgrade {safe_packages}")
    
    if medium_risk:
        print(f"\n⚠️  TEST REQUIRED ({len(medium_risk)} packages):")
        print("   Minor version updates - review changelogs and test thoroughly.")
    
    if high_risk:
        print(f"\n🚨 REVIEW NEEDED ({len(high_risk)} packages):")
        print("   Major version updates - check for breaking changes.")
        print("   Read migration guides before upgrading.")
    
    print("\n" + "=" * 70)
    print("\nFor detailed guide, see: UPGRADE_GUIDE.md")

if __name__ == "__main__":
    main()
