# Upgrading Packages with uv - Best Practices

## Quick Reference

### Check What's Outdated
```bash
uv pip list --outdated
```

### Upgrade Options

#### 1. **Upgrade Lock File Only** (Recommended for testing)
```bash
# See what would change without applying
uv lock --upgrade --check

# Actually upgrade the lock file
uv lock --upgrade

# Then sync to install
uv sync
```

#### 2. **Upgrade a Specific Package**
```bash
uv add --upgrade package-name
```

#### 3. **Upgrade All Packages** (Use with caution)
```bash
# Update pyproject.toml and regenerate lock
uv lock --upgrade
uv sync
```

#### 4. **Update Constraints in pyproject.toml**
```bash
# For packages with version constraints, you may need to edit pyproject.toml manually
# Then run:
uv lock
uv sync
```

## Recommended Workflow

### For Safe, Incremental Upgrades

1. **Check what's outdated:**
   ```bash
   uv pip list --outdated
   ```

2. **Review breaking changes:**
   - Check package changelogs
   - Review major version updates

3. **Upgrade patch versions only:**
   ```bash
   # Edit pyproject.toml to allow patch updates (e.g., change == to >=)
   # Or upgrade specific packages:
   uv add --upgrade package-name
   ```

4. **Test thoroughly:**
   ```bash
   uv sync
   uv run python main.py
   uv run pytest  # if you have tests
   ```

5. **Commit changes:**
   ```bash
   git add pyproject.toml uv.lock
   git commit -m "chore: upgrade packages"
   ```

## Using the Upgrade Script

The `upgrade_safely.sh` script provides an interactive way to upgrade:

```bash
./upgrade_safely.sh
```

It will:
- Show outdated packages
- Categorize them (patch/minor/major)
- Create backups
- Offer interactive upgrade

## Best Practices

1. **Always backup first:**
   ```bash
   cp pyproject.toml pyproject.toml.backup
   cp uv.lock uv.lock.backup
   ```

2. **Upgrade incrementally:**
   - Start with patch versions
   - Test after each upgrade
   - Then move to minor versions
   - Major versions need careful review

3. **Use version constraints wisely:**
   - `==2.1.0` - Exact version (most restrictive)
   - `>=2.1.0,<3.0.0` - Allow patch and minor
   - `>=2.1.0` - Allow all updates (risky)

4. **Check for conflicts:**
   ```bash
   uv lock --check
   ```

5. **Export for legacy systems:**
   ```bash
   uv export --format requirements-txt --output-file requirements.txt
   ```

## Troubleshooting

### Lock file conflicts
```bash
rm uv.lock
uv lock
```

### Dependency resolution errors
```bash
# Check what's causing issues
uv pip check

# Or resolve manually
uv lock --upgrade
```

### Need to downgrade
```bash
# Edit pyproject.toml to specify version
# Then:
uv lock
uv sync
```

## Comparison: Old vs New

| Task | Old (pip) | New (uv) |
|------|-----------|----------|
| Check outdated | `pip list --outdated` | `uv pip list --outdated` |
| Upgrade one | `pip install --upgrade pkg` | `uv add --upgrade pkg` |
| Upgrade all | `pip install --upgrade -r requirements.txt` | `uv lock --upgrade && uv sync` |
| Backup | Manual copy | `upgrade_safely.sh` handles it |
| Lock file | None (requirements.txt) | `uv.lock` (automatic) |




