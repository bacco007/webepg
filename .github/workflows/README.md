# GitHub Workflows

This directory contains all GitHub Actions workflows for the WebEPG project.

## Workflows

### CI/CD Workflows

- **`docker_build.yml`** - Builds and pushes Docker images for frontend and backend to GitHub Container Registry (GHCR) when changes are pushed to main branch
- **`frontend-ci.yml`** - Runs linting, formatting checks, and builds for the Next.js frontend
- **`backend-ci.yml`** - Runs linting, formatting checks, and type checking for the Python/FastAPI backend

### Security Workflows

- **`codeql.yml`** - Runs CodeQL analysis for JavaScript and Python to detect security vulnerabilities
- **`security-scan.yml`** - Comprehensive security scanning including:
  - Frontend: npm audit and Snyk scanning
  - Backend: pip audit, Safety, and Bandit scanning
  - Docker: Trivy vulnerability scanning

### Quality Assurance Workflows

- **`dependency-review.yml`** - Reviews dependency changes in pull requests for known vulnerabilities
- **`pr-lint.yml`** - Validates pull request titles follow conventional commit format and checks PR descriptions
- **`label.yml`** - Automatically applies labels to pull requests based on changed file paths (requires `.github/labeler.yml`)

### Maintenance Workflows

- **`stale.yml`** - Marks issues and pull requests as stale after a period of inactivity
- **`release.yml`** - Creates GitHub releases when tags matching `v*.*.*` are pushed

## Workflow Triggers

- **On Push**: Most workflows trigger on pushes to `main` branch
- **On Pull Request**: CI, security, and dependency workflows trigger on PRs
- **Scheduled**: CodeQL and security scanning run on weekly schedules

## Required Secrets

Some workflows may require additional secrets to be configured in your GitHub repository:

- `SNYK_TOKEN` (optional) - For Snyk security scanning in `security-scan.yml`

## GitHub Features Used

- **Actions**: All automated CI/CD processes
- **Dependabot**: Automated dependency updates (configured in `.github/dependabot.yml`)
- **Container Registry**: Docker images are pushed to GHCR
- **Code Scanning**: CodeQL analysis results appear in Security tab

## Customization

All workflows can be customized to suit your specific needs. Common customizations include:

- Changing branch names (currently `main`)
- Adjusting scheduling cron expressions
- Adding additional security checks
- Modifying build matrices for multiple platform support
- Adding deployment steps

## Workflow Status

You can view the status of all workflows in the Actions tab of your GitHub repository.

