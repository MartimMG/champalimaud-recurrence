# Environment Setup

This project uses Node.js and npm.

## Required software

- Node.js `22.20.0` (recommended)
- npm `10.9.3` or compatible with Node 22
- Python `3.13+` (for model update script)

## Install commands (Windows PowerShell)

```powershell
# in project root
npm install
python -m pip install -r scripts/requirements-model-updater.txt
```

## Reproducible install

After the lockfile is in sync, you can use:

```powershell
npm ci
```

## Run the project

```powershell
npm run dev
```

## Update model from a `.pkl` bundle

```powershell
python scripts/update_model_from_pkl.py --bundle coxnet_model_bundle.pkl --output src/lib/coxModel.ts
```

This regenerates all model coefficients, thresholds, baseline hazards, and input variables in `src/lib/coxModel.ts` using non-zero coefficients from the bundle.

## Notes

- Installed dependencies are stored in `node_modules`.
- Exact dependency versions are saved in `package-lock.json`.
