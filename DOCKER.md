# Docker Build and Deployment Guide

This document describes how to build, version, and deploy RackView using Docker and GitHub Container Registry (GHCR).

## Overview

RackView uses a multi-stage Docker build process and automated CI/CD via GitHub Actions to build and push images to GHCR on every push.

## Prerequisites

- Docker installed and running
- GitHub repository with Actions enabled
- Access to GitHub Container Registry (GHCR)

## Local Development

### Using Docker Compose

The easiest way to run RackView locally is using Docker Compose:

```bash
docker-compose up -d
```

This will:
- Start a PostgreSQL database container
- Build and start the backend application
- Expose the API on `http://localhost:8080`

### Manual Docker Build

To build the Docker image manually:

```bash
docker build -t rackview:latest .
```

To run the container:

```bash
docker run -d \
  -p 8080:8080 \
  -e DB_HOST=postgres \
  -e DB_PORT=5432 \
  -e DB_USER=rackview \
  -e DB_PASSWORD=rackview \
  -e DB_NAME=rackview \
  --name rackview \
  rackview:latest
```

## Version Management

RackView uses semantic versioning (SemVer) for releases. Version information is stored in the `VERSION` file.

### Version Scripts

Two version management scripts are provided:

#### Linux/macOS (Bash)

```bash
# Get current version
./scripts/version.sh get

# Set version explicitly
./scripts/version.sh set 1.2.3

# Bump version (patch, minor, or major)
./scripts/version.sh bump patch   # 1.2.3 -> 1.2.4
./scripts/version.sh bump minor   # 1.2.3 -> 1.3.0
./scripts/version.sh bump major   # 1.2.3 -> 2.0.0

# Create git tag for current version
./scripts/version.sh tag
```

#### Windows (PowerShell)

```powershell
# Get current version
.\scripts\version.ps1 get

# Set version explicitly
.\scripts\version.ps1 set 1.2.3

# Bump version
.\scripts\version.ps1 bump patch
.\scripts\version.ps1 bump minor
.\scripts\version.ps1 bump major

# Create git tag
.\scripts\version.ps1 tag
```

### Release Workflow

1. **Update version:**
   ```bash
   ./scripts/version.sh bump patch  # or minor/major
   ```

2. **Commit the version change:**
   ```bash
   git add VERSION
   git commit -m "Bump version to $(./scripts/version.sh get)"
   ```

3. **Create and push tag:**
   ```bash
   ./scripts/version.sh tag
   git push origin main
   git push origin v$(./scripts/version.sh get)
   ```

4. **GitHub Actions will automatically:**
   - Build the Docker image
   - Tag it with the version
   - Push to GHCR

## GitHub Actions CI/CD

The GitHub Actions workflow (`.github/workflows/docker-build-push.yml`) automatically:

- **On push to main/master:** Builds and pushes images with branch name and commit SHA tags
- **On version tags (v*.*.*):** Builds and pushes images with semantic version tags
- **On pull requests:** Builds images but doesn't push (for testing)

### Image Tags

Images are tagged with multiple tags for flexibility:

- `latest` - Always points to the latest build from the default branch
- `main` or `master` - Branch name tag
- `v1.2.3` - Semantic version (from git tags)
- `1.2.3` - Version without 'v' prefix
- `1.2` - Major.minor version
- `1` - Major version only
- `main-abc12345` - Branch name with commit SHA

### Pulling Images

Images are available at:
```
ghcr.io/<your-username>/<repository-name>:<tag>
```

Example:
```bash
docker pull ghcr.io/username/rackview:latest
docker pull ghcr.io/username/rackview:v1.2.3
```

### GHCR Permissions

To pull images from GHCR, you may need to:

1. Go to your repository on GitHub
2. Click "Packages" in the right sidebar
3. Click on your package
4. Click "Package settings"
5. Under "Manage Actions access", ensure your repository has write access

For public repositories, images are publicly accessible. For private repositories, you'll need to authenticate:

```bash
echo $GITHUB_TOKEN | docker login ghcr.io -u USERNAME --password-stdin
```

## Environment Variables

The application supports the following environment variables:

| Variable | Default | Description |
|----------|---------|-------------|
| `DB_HOST` | `localhost` | PostgreSQL host |
| `DB_PORT` | `5432` | PostgreSQL port |
| `DB_USER` | `rackview` | Database user |
| `DB_PASSWORD` | `rackview` | Database password |
| `DB_NAME` | `rackview` | Database name |
| `DB_SSLMODE` | `disable` | SSL mode for database connection |
| `PORT` | `8080` | HTTP server port |
| `STATIC_PATH` | `/app/frontend/dist` | Path to static frontend files |
| `INDEX_PATH` | `/app/frontend/dist/index.html` | Path to index.html |

## Production Deployment

### Using Docker

```bash
# Pull the latest image
docker pull ghcr.io/username/rackview:latest

# Run with production environment variables
docker run -d \
  -p 8080:8080 \
  -e DB_HOST=your-db-host \
  -e DB_PORT=5432 \
  -e DB_USER=your-db-user \
  -e DB_PASSWORD=your-db-password \
  -e DB_NAME=rackview \
  -e DB_SSLMODE=require \
  --name rackview \
  --restart unless-stopped \
  ghcr.io/username/rackview:latest
```

### Using Docker Compose

Create a `docker-compose.prod.yml`:

```yaml
version: '3.8'

services:
  backend:
    image: ghcr.io/username/rackview:latest
    environment:
      DB_HOST: ${DB_HOST}
      DB_PORT: ${DB_PORT}
      DB_USER: ${DB_USER}
      DB_PASSWORD: ${DB_PASSWORD}
      DB_NAME: ${DB_NAME}
      DB_SSLMODE: require
    ports:
      - "8080:8080"
    restart: unless-stopped
```

Then run:
```bash
docker-compose -f docker-compose.prod.yml up -d
```

## Troubleshooting

### Build Fails with "go.mod not found"

Ensure you're building from the repository root, not from the `backend/` directory. The Dockerfile expects the repository structure to be intact.

### Image Not Found in GHCR

- Check that the GitHub Actions workflow completed successfully
- Verify package permissions in GitHub repository settings
- Ensure you're using the correct image name format: `ghcr.io/username/repo:tag`

### Database Connection Issues

- Verify database is accessible from the container
- Check environment variables are set correctly
- For Docker Compose, ensure the database service is healthy before the backend starts

## Security Considerations

- Never commit `.env` files or hardcode credentials
- Use environment variables or secrets management for sensitive data
- Regularly update base images to patch security vulnerabilities
- Review and update dependencies regularly
- The Docker image runs as a non-root user for security
