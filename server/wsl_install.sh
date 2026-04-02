#!/usr/bin/env sh
# Install SurvSHAP API dependencies in WSL (Linux).
# Usage from repo root:
#   chmod +x server/wsl_install.sh && ./server/wsl_install.sh

set -eu
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ ! -d .venv ]]; then
  python3 -m venv .venv
fi
# shellcheck disable=SC1091
source .venv/bin/activate
python -m pip install --upgrade pip
python -m pip install -r server/requirements.txt

echo ""
echo "Done. Activate with: source .venv/bin/activate"
echo "Run API: python -m uvicorn server.main:app --reload --host 127.0.0.1 --port 8000"
