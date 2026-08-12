# WiFi Hotspot Portal Frontend

Next.js 15 (App Router), React 19, and TypeScript frontend for the WiFi Hotspot Portal. It talks to the active NestJS backend in `../backend` and keeps the original `/api/...` route contract.

## Structure

```text
wifi-portal/
├── app/                  # Next.js routes, metadata, global CSS
├── components/           # Portal UI, plans, payment, session status, modals
├── context/              # SessionProvider and useSession hook
├── hooks/                # WiFi session workflow logic
├── lib/                  # Constants and pure helpers
├── services/             # API client
├── tests/                # Vitest smoke tests
└── types/                # Shared TypeScript API types
```

## Environment

Copy `.env.example` to `.env.local` if you need to override defaults.

| Variable | Description | Default |
| --- | --- | --- |
| `NEXT_PUBLIC_API_BASE_URL` | NestJS API base URL, including `/api` | `http://localhost:8000/api` |
| `NEXT_PUBLIC_SITE_URL` | Public frontend URL for metadata | `http://localhost:3000` |

## Run Locally

Start the backend first:

```bash
cd ../backend
npm run start:dev
```

Then start the frontend:

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Next.js dev server |
| `npm run build` | Create a production build |
| `npm run start` | Serve the production build |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Run TypeScript checks |
| `npm test` | Run Vitest |

## Backend Contract

The API client expects the NestJS backend to support:

- `GET /api/plans/`
- `POST /api/accounts/register/`
- `POST /api/accounts/login/`
- `POST /api/payments/initiate/`
- `POST /api/payments/{id}/simulate/`
- `POST /api/sessions/create/`
- `POST /api/sessions/token/connect/`
- `POST /api/sessions/{id}/terminate/`

Authentication uses `Authorization: Token <token>` to remain compatible with the original portal flow.
