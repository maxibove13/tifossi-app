# Render Test Environment

This Docker environment simulates Render.com's production environment for local testing of Strapi deployments.

## Purpose

Test your Strapi configuration locally before deploying to Render, catching configuration errors that would cause deployment failures.

## What It Includes

- **PostgreSQL 16**: Same version as Render's managed PostgreSQL
- **Node 18**: Matching Render's Node.js environment
- **Production Build**: Runs `npm ci && npm run build && npm run start` like Render
- **Environment Variables**: Simulates Render's env var setup
- **Health Checks**: Tests application startup and availability

## Quick Start

```bash
# Start the test environment
./test-env.sh start

# View logs
./test-env.sh logs

# Stop the environment
./test-env.sh stop

# Clean up everything
./test-env.sh clean
```

## Available Commands

- `./test-env.sh start` - Build and start the test environment
- `./test-env.sh stop` - Stop the test environment
- `./test-env.sh clean` - Remove all containers and volumes
- `./test-env.sh logs` - Show Strapi logs (follow mode)
- `./test-env.sh shell` - Open a shell in the Strapi container
- `./test-env.sh db` - Open a PostgreSQL shell
- `./test-env.sh rebuild` - Clean rebuild of everything

## What It Tests

1. **Database Configuration**: Validates `config/database.js` with a real PostgreSQL connection
2. **Build Process**: Runs `npm run build` exactly like Render does
3. **Startup Process**: Tests `npm run start` with production environment
4. **Connection Pooling**: Ensures database pool settings work correctly
5. **SSL Configuration**: Tests SSL settings (disabled for local, enabled for Render)

## Environment Variables

The test environment sets these variables to match Render:

```bash
NODE_ENV=production
DATABASE_URL=postgresql://strapi_user:strapi_password@postgres:5432/strapi_test
DATABASE_CLIENT=postgres
DATABASE_SSL=false  # Set to true in actual Render deployment
APP_KEYS=test-key-1,test-key-2,test-key-3,test-key-4
JWT_SECRET=test-jwt-secret
# ... and other required Strapi secrets
```

## Troubleshooting

### Container fails to start

Check logs:
```bash
./test-env.sh logs
```

### Database connection errors

Verify PostgreSQL is running:
```bash
docker-compose ps
```

Access database directly:
```bash
./test-env.sh db
```

### Build failures

Open a shell in the container:
```bash
./test-env.sh shell
cd /app
npm run build
```

### Port already in use

Stop any existing Strapi instances:
```bash
docker-compose down
# Or kill processes on port 1337
lsof -ti:1337 | xargs kill
```

## Differences from Render

- **SSL**: Disabled in local testing, enabled in Render
- **Secrets**: Hardcoded here, auto-generated in Render
- **Networking**: Local Docker network vs Render's infrastructure
- **Volumes**: Local filesystem vs Render's ephemeral storage

## Next Steps

After successful local testing:

1. Commit your changes
2. Push to your repository
3. Render will automatically deploy using the same steps
4. Monitor deployment logs in Render dashboard

## Notes

- The environment uses Docker volumes for persistent PostgreSQL data
- Strapi code is mounted from your local filesystem for live testing
- Use `./test-env.sh clean` to start fresh with a new database
