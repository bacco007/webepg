# GitHub Workflows Documentation

This document provides an overview of all GitHub Actions workflows configured for the WebEPG project.

## Summary

Your repository now has **10 workflows** configured to automate CI/CD, security scanning, code quality checks, and maintenance tasks.

## Workflow Categories

### 🔧 CI/CD Workflows (3)

#### 1. Docker Build and Push (`docker_build.yml`)
- **Purpose**: Builds and pushes Docker images for frontend and backend
- **Triggers**: Push to `main` branch
- **Features**:
  - Detects changes in frontend/backend directories
  - Builds only modified services
  - Pushes to GitHub Container Registry (GHCR)
  - Generates artifact attestations for supply chain security
- **Status**: ✅ Already exists and configured

#### 2. Frontend CI (`frontend-ci.yml`)
- **Purpose**: Linting, formatting, and build checks for Next.js frontend
- **Triggers**: Pull requests and pushes to `main`
- **Features**:
  - Biome linting and formatting checks
  - Build verification
  - Uses pnpm with frozen lockfile
  - Node.js 20 with caching

#### 3. Backend CI (`backend-ci.yml`)
- **Purpose**: Linting, formatting, and type checking for Python backend
- **Triggers**: Pull requests and pushes to `main`
- **Features**:
  - Ruff linting and format checking
  - MyPy type checking
  - Uses `uv` package manager with caching
  - Python 3.12

### 🔒 Security Workflows (3)

#### 4. CodeQL Analysis (`codeql.yml`)
- **Purpose**: Advanced security vulnerability detection
- **Triggers**: Push, PR, and weekly schedule
- **Features**:
  - JavaScript and Python analysis
  - Security and quality queries
  - Results appear in Security tab
  - GitHub-native solution

#### 5. Security Scan (`security-scan.yml`)
- **Purpose**: Comprehensive security scanning across the stack
- **Triggers**: Push, PR, and weekly schedule
- **Features**:
  - **Frontend**: npm audit + Snyk scanning
  - **Backend**: pip audit + Safety + Bandit
  - **Docker**: Trivy vulnerability scanning with SARIF upload
  - Continue-on-error for comprehensive reporting

#### 6. Dependency Review (`dependency-review.yml`)
- **Purpose**: Review dependency changes in PRs
- **Triggers**: Pull requests to `main`
- **Features**:
  - Detects known vulnerabilities in new/updated dependencies
  - Comments summary in PR
  - Can block PRs with critical vulnerabilities
- **Status**: ✅ Already exists

### 📋 Quality Assurance Workflows (3)

#### 7. PR Lint (`pr-lint.yml`)
- **Purpose**: Ensure PRs follow standards
- **Triggers**: Pull request opened/updated
- **Features**:
  - Validates PR title format (conventional commits)
  - Checks PR description completion
  - Blocks WIP branches
  - Supports scopes: frontend, backend, docker, config, docs

#### 8. Labeler (`label.yml`)
- **Purpose**: Auto-label PRs based on changed files
- **Triggers**: Pull request events
- **Features**:
  - Labels: frontend, backend, docker, documentation, ci, dependencies, config, security
  - Uses `.github/labeler.yml` configuration
- **Status**: ✅ Already exists

#### 9. Stale Issues/PRs (`stale.yml`)
- **Purpose**: Manage inactive issues and PRs
- **Triggers**: Weekly schedule (2:21 AM)
- **Features**:
  - Warns and closes inactive items
  - Labels: `no-issue-activity`, `no-pr-activity`
  - Prevents repository clutter
- **Status**: ✅ Already exists

### 🚀 Release Workflows (1)

#### 10. Release (`release.yml`)
- **Purpose**: Automated GitHub releases
- **Triggers**: Push of version tag (e.g., `v1.0.0`)
- **Features**:
  - Creates release from tag
  - Uploads package files as assets
  - Works with semantic versioning

## Additional Files Created

### Configuration Files
- **`.github/labeler.yml`** - Defines which labels apply to which file paths
- **`.github/CODEOWNERS`** - Specifies code owners for auto-review requests

### Templates
- **`.github/PULL_REQUEST_TEMPLATE.md`** - Standard PR template
- **`.github/ISSUE_TEMPLATE/`** - Bug report and feature request templates
- **`.github/ISSUE_TEMPLATE/config.yml`** - Disables blank issues, adds discussion link

### Documentation
- **`.github/workflows/README.md`** - Detailed workflow documentation

## Recommended Next Steps

### 1. Configure Secrets (Optional)
If you want full security scanning functionality, add to your repository secrets:
```bash
SNYK_TOKEN=<your-snyk-token>
```

### 2. Update CodeOWNERS
Edit `.github/CODEOWNERS` and replace `YOUR_GITHUB_USERNAME` with your actual GitHub username.

### 3. Update Issue Template Config
Edit `.github/ISSUE_TEMPLATE/config.yml` and replace `YOUR_USERNAME` with your GitHub username.

### 4. Enable Branch Protection
In your repository settings, configure branch protection for `main`:
1. Go to Settings → Branches
2. Add rule for `main` branch
3. Enable:
   - ✅ Require status checks to pass
   - ✅ Require branches to be up to date
   - ✅ Require pull request reviews
4. Add required status checks from your workflows

### 5. Test the Workflows
1. Create a test PR and verify labels are applied
2. Ensure CI checks run automatically
3. Test the PR lint workflow with different commit message formats
4. Try creating an issue to verify templates work

## Workflow Interdependencies

```
GitHub Push/PR
    ↓
├─→ Frontend CI ──→ Docker Build (if frontend changed)
├─→ Backend CI ────→ Docker Build (if backend changed)
├─→ Security Scan ─→ CodeQL (weekly schedule)
├─→ Dependency Review (PRs only)
├─→ PR Lint (PRs only)
└─→ Labeler (PRs only)
```

## Scheduling

Weekly scheduled workflows:
- **CodeQL**: Sunday at 1:30 AM
- **Security Scan**: Monday at 2:00 AM
- **Stale**: Monday at 2:21 AM

## Best Practices

1. **Branch Protection**: Always protect the main branch with required status checks
2. **Security Scanning**: Run security scans both on-demand and scheduled
3. **Dependency Updates**: Rely on Dependabot configured in `.github/dependabot.yml`
4. **Conventional Commits**: Use the PR lint workflow to enforce commit standards
5. **Artifact Attestations**: Leverage the built-in attestations in Docker workflow

## Monitoring

Monitor workflow health:
1. Check the Actions tab regularly
2. Set up GitHub notifications for failed workflows
3. Review CodeQL results in the Security tab
4. Monitor dependency updates from Dependabot

## Troubleshooting

### Common Issues

**Workflows not triggering:**
- Verify the `on:` trigger conditions in workflow files
- Check that workflows are committed to the default branch
- Ensure workflow files have `.yml` extension

**Security scan failures:**
- Most security scans use `continue-on-error: true` to report but not fail
- Check individual job outputs for specific vulnerabilities
- Add missing secrets for third-party services (Snyk, etc.)

**PR lint failures:**
- Ensure PR titles follow: `type(scope): description` format
- Verify PR descriptions match the required pattern
- Check that PRs aren't using WIP branches

## Customization

All workflows are customizable. Common modifications:

- **Branch names**: Change `main` to your default branch
- **Schedules**: Adjust cron expressions for your timezone
- **Node/Python versions**: Update version matrices
- **Platforms**: Add Linux/macOS/Windows runners
- **Notifications**: Add Slack/Discord webhooks
- **Deployments**: Add deployment steps to workflows

## Further Reading

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [CodeQL Documentation](https://codeql.github.com/docs/)
- [Dependabot Documentation](https://docs.github.com/en/code-security/dependabot)

