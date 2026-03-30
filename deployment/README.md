# Deployment Root Directory

This folder contains production deployment files for the Student Financial Planner app.

## Files

- `docker-compose.prod.yml` - Runs MongoDB, backend, and frontend.
- `backend.Dockerfile` - Builds the Express backend image.
- `frontend.Dockerfile` - Builds the React app and serves it with Nginx.
- `nginx.conf` - Frontend server config with `/api` proxy to backend.

## Prerequisites

- Docker Desktop
- A backend env file at `backend/.env`

## Quick Start

From this `deployment` directory, run:

```powershell
docker compose -f docker-compose.prod.yml up -d --build
```

App URLs after startup:

- Frontend: `http://localhost`
- Backend API: `http://localhost:5001/api`

## Stop

```powershell
docker compose -f docker-compose.prod.yml down
```

## Notes

- Frontend API base now defaults to `/api` (reverse-proxy friendly).
- If needed, override frontend API target using `REACT_APP_API_BASE` at build time.
- Set `MONGODB_URI` in your environment to use managed MongoDB instead of the local `mongo` container.
