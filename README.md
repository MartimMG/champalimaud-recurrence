# Regional Recurrence Risk Assessment

A web calculator for five-year regional recurrence risk in early breast cancer, built on a
LASSO-penalised Cox proportional hazards model fitted to the BreastCare database of the
Champalimaud Foundation. The site has two views:

- `/` — landing/methodology page explaining how the model was built, validated, and turned into risk zones.
- `/app` — the calculator itself.

## Tech stack

- React + TypeScript, built with Vite
- Tailwind CSS + shadcn/ui components
- React Router, TanStack Query
- FastAPI backend (`server/`) for API endpoints
- A Python script (`scripts/update_model_from_pkl.py`) regenerates the frontend's model
  coefficients from a pickled model bundle

## Requirements

- Node.js `22.20.0` (see `.nvmrc`)
- Python `3.13+` (for the API server and the model-update script)

## Setup

```powershell
npm install
python -m pip install -r server/requirements.txt
python -m pip install -r scripts/requirements-model-updater.txt
```

Use `npm ci` instead of `npm install` for a reproducible install once the lockfile is in sync.

## Development

```powershell
npm run dev   # Vite dev server (proxies /api to the backend)
npm run api   # FastAPI backend on http://127.0.0.1:8000
```

## Other scripts

```powershell
npm run build       # production build
npm run build:dev   # development-mode build
npm run preview      # preview a production build locally
npm run lint          # ESLint
npm run test           # run tests once (Vitest)
npm run test:watch      # run tests in watch mode
```

## Updating the model

```powershell
python scripts/update_model_from_pkl.py --bundle coxnet_model_bundle.pkl --output src/lib/coxModel.ts
```

This regenerates the coefficients, thresholds, baseline hazards, and input variables in
`src/lib/coxModel.ts` from the non-zero coefficients in the `.pkl` bundle.
