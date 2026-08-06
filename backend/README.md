# WiFi Hotspot Portal API

NestJS backend for the WiFi Hotspot Portal. It preserves the original Django REST URL and payload contract so the migrated Next.js frontend can keep using `/api/accounts/...`, `/api/plans/...`, `/api/payments/...`, and `/api/sessions/...` without client-side rewrites.

## Current Storage

This migration uses in-memory storage for local development and tests. Data resets whenever the process restarts. The archived Django source remains in `../backend-django/` for reference while a persistent database layer is added later.

## Run Locally

```bash
npm install
npm run start:dev
```

The API listens on `http://localhost:8000` by default. Override with `PORT=8001` if needed.

## Scripts

```bash
npm run build
npm run lint
npm test
npm run test:e2e
```

## Main Endpoints

- `GET /api/health/`
- `POST /api/accounts/register/`
- `POST /api/accounts/login/`
- `GET /api/plans/`
- `POST /api/payments/initiate/`
- `POST /api/payments/{id}/simulate/`
- `POST /api/sessions/create/`
- `POST /api/sessions/token/connect/`
- `POST /api/sessions/{id}/terminate/`
