# Deployment Guide

## Overview

This project uses **GitHub Actions** + **GitHub Container Registry (GHCR)** + **Dokploy** for automated deployments:

```
Push to main → GitHub Actions builds → Push to GHCR → Trigger Dokploy → Deploy
```

## Workflow

### 1. GitHub Actions Workflow (`.github/workflows/deploy.yml`)

**Trigger:** On every push to `main` branch

**Jobs:**

#### Job 1: Build and Push
- Checkout code
- Login to GitHub Container Registry (GHCR)
- Build Docker image with cache
- Push image to GHCR with multiple tags:
  - `ghcr.io/owner/repo:latest`
  - `ghcr.io/owner/repo:main`
  - `ghcr.io/owner/repo:main-<sha>`

#### Job 2: Deploy
- Trigger Dokploy deployment via API
- Uses application ID and API key

### 2. Required GitHub Secrets

Go to **Settings → Secrets and variables → Actions → New repository secret**

| Secret | Description | How to get |
|--------|-------------|------------|
| `DOKPLOY_WEBHOOK_URL` | Webhook URL for auto-deploy | Dokploy UI → Application → Deployments → Copy Webhook URL |

### 3. Setting Up Dokploy

#### Create Application in Dokploy

1. Go to your Dokploy dashboard
2. Click **Create Application**
3. Select **Docker** as source type
4. Enter image: `ghcr.io/YOUR_USERNAME/focus:latest`
5. Set port: `3000`
6. Configure environment variables in Dokploy:
   - `DATABASE_URL` (use internal Docker network, e.g., `postgresql://user:pass@postgres:5432/focus`)
   - `BETTER_AUTH_BASE_URL`
   - `NEXT_PUBLIC_APP_URL`
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`

#### Get Application ID

1. Go to your application in Dokploy
2. Look at the URL or application settings
3. Copy the application ID
4. Add to GitHub secrets as `DOKPLOY_APPLICATION_ID`

#### Get API Key

1. In Dokploy, go to **Settings → API Keys**
2. Generate a new API key
3. Add to GitHub secrets as `DOKPLOY_API_KEY`

## Deployment Process

### Automatic Deployment

Every push to `main` branch triggers:

```bash
1. GitHub Actions starts
2. Docker image builds
3. Image pushed to GHCR
4. Dokploy deployment triggered via API
5. Dokploy pulls new image and deploys
```

### Manual Deployment

You can also trigger manually:

1. Go to **Actions** tab in GitHub
2. Select **Build and Deploy** workflow
3. Click **Run workflow**

## Image Tags

Images are tagged with:
- `latest` - Always points to latest main branch build
- `main` - Current main branch
- `main-<short-sha>` - Specific commit SHA

Use `latest` tag in Dokploy for automatic updates.

## Troubleshooting

### Build fails in GitHub Actions

Check:
- `DATABASE_URL` secret is set correctly
- Dockerfile syntax is valid
- All files are committed (including `bun.lock`)

### Image not pushed to GHCR

Check:
- `GITHUB_TOKEN` has `packages: write` permission
- Repository has Packages enabled in Settings

### Dokploy not deploying

Check:
- `DOKPLOY_URL` is correct (include `https://`)
- `DOKPLOY_API_KEY` is valid and not expired
- `DOKPLOY_APPLICATION_ID` matches your application
- Image name in Dokploy matches: `ghcr.io/OWNER/REPO:latest`

### Container fails to start

Check Dokploy logs:
1. Go to application in Dokploy
2. Click **Logs** tab
3. Look for migration errors or missing env vars

## Security Notes

- **Never** commit `.env` file or secrets
- **Always** use GitHub Secrets for sensitive data
- **Database stays isolated** - no external access needed
- **GHCR images are private** by default (good!)

## Local Testing

Before pushing, test locally:

```bash
# Build image
docker build --build-arg DATABASE_URL="postgresql://..." -t focus-app:latest .

# Run container
docker run -p 3000:3000 -e DATABASE_URL="..." focus-app:latest
```

## Advanced: Multi-platform Builds

The workflow builds for `linux/amd64`. To add ARM support:

```yaml
platforms: linux/amd64,linux/arm64
```

Note: This increases build time.
