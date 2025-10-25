# Package Upgrade Guide for WebEPG Backend

## 🎯 Best Practices for Safe Upgrades

### 1. **Use `pip-compile` for Dependency Resolution**
```bash
# Install pip-tools if not already installed
pip install pip-tools

# Create a requirements.in file from requirements.txt
pip-compile requirements.txt

# Update dependencies
pip-compile --upgrade requirements.txt
```

### 2. **Check for Outdated Packages**
```bash
# List all outdated packages
pip list --outdated

# Check specific package
pip show <package-name>
```

### 3. **Safe Upgrade Strategy**

#### Step 1: Upgrade pip first
```bash
pip install --upgrade pip
```

#### Step 2: Test in a virtual environment
```bash
python -m venv test_env
source test_env/bin/activate  # On Windows: test_env\Scripts\activate
pip install -r requirements.txt
```

#### Step 3: Upgrade packages incrementally
```bash
# Upgrade one package at a time
pip install --upgrade <package-name>

# Test your application
python -m pytest  # or your test command
```

### 4. **Use `pip-check` for Dependency Conflicts**
```bash
# Install pip-check
pip install pip-check

# Check for outdated packages with dependency info
pip-check
```

### 5. **Automated Safe Upgrades**

Run the provided helper script:
```bash
bash upgrade_safely.sh
```

Or manually upgrade patch versions only:
```bash
# Upgrade all patch versions (same major.minor)
pip list --outdated --format=freeze | \
  grep -v ":\d+\." | \
  cut -d'=' -f1 | \
  xargs -n1 pip install --upgrade
```

## 📋 Current Package Status

### Critical Packages to Monitor

1. **FastAPI & Related**
   - `fastapi==0.120.0` - Check for security updates
   - `pydantic==2.10.6` - Check for v2 breaking changes
   - `starlette==0.45.3` - Core dependency

2. **Web Scraping**
   - `beautifulsoup4==4.13.3` - Security patches
   - `lxml==5.3.0` - Check for lxml 6.0 breaking changes
   - `requests==2.32.5` - Keep up to date

3. **Data Processing**
   - `pandas==2.3.3` - Major updates may have breaking changes
   - `numpy==2.2.3` - Check compatibility
   - `python-dateutil==2.9.0.post0` - Keep current

4. **Selenium & Browser Automation**
   - `selenium==4.31.0` - Check browser compatibility
   - `webdriver-manager==4.0.2` - Keep current

## ⚠️ Breaking Changes to Watch For

### Lxml 6.0
```python
# Breaking changes in lxml 6.0:
# - Python 3.8+ required
# - Some deprecated functions removed
# Check: https://lxml.de/5.4/changes-6.0.html
```

### Pydantic v2
```python
# Already on v2, but be careful with:
# - ConfigDict instead of Config class
# - Field changes
# Check: https://docs.pydantic.dev/latest/migration/
```

### Pandas 2.x
```python
# Already on v2, watch for:
# - StringDtype changes
# - Index type changes
# - datetime64[ns] changes
```

## 🔧 Recommended Upgrade Order

1. **Patch versions first** (X.Y.Z → X.Y.Z+1)
   - Usually bug fixes only
   - Should be safe

2. **Minor versions** (X.Y.Z → X.Y+1.0)
   - New features, usually backward compatible
   - Test thoroughly

3. **Major versions** (X.Y.Z → X+1.0.0)
   - May have breaking changes
   - Read migration guides
   - Test extensively

## 🧪 Testing After Upgrades

```bash
# Run your test suite
pytest

# Check for deprecation warnings
python -W default -m pytest

# Type checking with mypy
mypy app/

# Linting
ruff check app/
```

## 📝 Update Requirements File

After successful upgrade:
```bash
# Freeze current versions
pip freeze > requirements.txt

# Or use specific versions
pip list --format=freeze > requirements.txt
```

## 🚨 Rollback Plan

If something breaks:
```bash
# Restore backup
cp requirements.txt.backup requirements.txt

# Reinstall from backup
pip install -r requirements.txt
```

## 📚 Additional Resources

- [Python Package Index](https://pypi.org/)
- [Pip User Guide](https://pip.pypa.io/en/stable/user_guide/)
- [Python Packaging Guide](https://packaging.python.org/)

## 💡 Quick Reference Commands

```bash
# Check outdated packages
pip list --outdated

# Upgrade specific package
pip install --upgrade <package>

# Upgrade all packages (risky)
pip list --outdated --format=freeze | cut -d'=' -f1 | xargs -n1 pip install --upgrade

# Create requirements backup
cp requirements.txt requirements.txt.backup

# Reinstall from requirements
pip install -r requirements.txt
```
