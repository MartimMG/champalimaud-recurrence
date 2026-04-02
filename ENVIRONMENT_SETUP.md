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

## SurvSHAP API (Python, Linux / WSL recommended)

The Variable Importance tab calls a small FastAPI service. On Windows, native `pip install` for `scikit-survival` may fail (e.g. `ecos` build); use **WSL** (Ubuntu) or Docker.

### 1. Reference data (X_ref, y_ref)

The API uses training-like reference data for SurvSHAP. Provide it in one of these ways:

**A — Inside `coxnet_model_bundle.pkl` (recommended)**  
Add keys **`X_ref`** and **`y_ref`** to the same dict you already load for `cox_model` and `scaler`. The server checks these first.

**B — Separate file**  
A pickle that is either:

- A dict with **`X_ref`** and **`y_ref`** (also accepted: `Xref` / `yref`, or `X` / `y`), or  
- A tuple `(X, y)`.

`X_ref` must be a `pandas.DataFrame` or 2D `numpy` array whose columns match the Cox scaler’s feature names (same order as in training).  
`y_ref` must be a **scikit-survival** survival array with fields `event` and `time`, or a tuple `(event_array, time_array)`.

If no file is found and the bundle has no `X_ref`/`y_ref`, the API falls back to a **synthetic** reference (uniform X + random survival).

Separate-file search order: optional `referencePath` in the JSON body, then env **`SURVSHAP_REFERENCE`**, then project root files **`survshap_reference.pkl`**, **`Xref_yref.pkl`**.

### 2. Install in WSL

From an Ubuntu WSL shell, with the repo under `/mnt/c/...`:

```bash
cd "/mnt/c/Users/<you>/.../champalimaud-recurrence"
chmod +x server/wsl_install.sh
./server/wsl_install.sh
source .venv/bin/activate
python -m uvicorn server.main:app --reload --host 127.0.0.1 --port 8000
```

In another terminal, run the frontend (`npm run dev` on Windows is fine). The Vite dev server proxies `/api` to `http://127.0.0.1:8000`; run the API inside WSL so the port is listening there.

### 3. Same machine: Windows browser + WSL API

If the API runs in WSL on port 8000, `127.0.0.1:8000` from Windows usually reaches WSL. If not, set `VITE_SURVSHAP_API_URL` to the URL that works.

## Notes

- Installed dependencies are stored in `node_modules`.
- Exact dependency versions are saved in `package-lock.json`.
