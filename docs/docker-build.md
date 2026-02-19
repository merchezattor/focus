# Docker Build Guide

## Building the Image

### Local Build

```bash
# Build the image (DATABASE_URL required for build-time static generation)
docker build --build-arg DATABASE_URL="postgresql://..." -t focus-app:latest .

# Build with specific tag
docker build --build-arg DATABASE_URL="postgresql://..." -t focus-app:v1.0.0 .
```

### Multi-platform Build (for CI/CD)

```bash
# Create builder
docker buildx create --name multiplatform --use

# Build for multiple platforms
docker buildx build --platform linux/amd64,linux/arm64 -t focus-app:latest --push .
```

## Running the Container

### Required Environment Variables

- `DATABASE_URL` - PostgreSQL connection string
- `BETTER_AUTH_BASE_URL` - Auth server base URL
- `NEXT_PUBLIC_APP_URL` - Public app URL
- `GOOGLE_CLIENT_ID` - Google OAuth client ID
- `GOOGLE_CLIENT_SECRET` - Google OAuth client secret

### Basic Run

```bash
docker run -d \
  -p 3000:3000 \
  -e DATABASE_URL="postgresql://..." \
  -e BETTER_AUTH_BASE_URL="https://app.example.com" \
  -e NEXT_PUBLIC_APP_URL="https://app.example.com" \
  -e GOOGLE_CLIENT_ID="xxx" \
  -e GOOGLE_CLIENT_SECRET="xxx" \
  --name focus-app \
  focus-app:latest
```

### Using Docker Compose

```bash
# Copy environment file
cp .env .env.docker

# Edit .env.docker with production values

# Start services
docker-compose up -d

# View logs
docker-compose logs -f app

# Stop services
docker-compose down
```

## Image Optimization

The Dockerfile uses multi-stage builds to:

1. **Dependencies stage** - Install packages (cached layer)
2. **Builder stage** - Compile Next.js standalone output
3. **Runner stage** - Minimal production image (~188MB)

### Security Features

- Non-root user (`nextjs:nodejs`)
- Minimal Alpine base image
- No build tools in production
- Health check enabled

## Troubleshooting

### Build Failures

- Check `.dockerignore` excludes node_modules
- Verify `bun.lock` is committed
- Ensure `next.config.ts` has `output: "standalone"`

### Runtime Issues

- Verify all required env vars are set
- Check database connectivity
- Review container logs: `docker logs focus-app`
