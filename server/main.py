"""
FastAPI server for SurvSHAP(t) explanations.

Run from repo root:
  cd server && uvicorn main:app --reload --port 8000

Or: python -m uvicorn server.main:app --reload --port 8000
"""

from __future__ import annotations

import traceback
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

try:
    from survshap_service import compute_survshap
except ImportError:
    from server.survshap_service import compute_survshap

app = FastAPI(title="SurvSHAP API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class FeatureMeta(BaseModel):
    name: str
    group: str


class SurvShapRequest(BaseModel):
    rawFeatures: list[float] = Field(..., description="Raw feature values in FEATURES order")
    meta: list[FeatureMeta] = Field(..., description="Feature name + display group for aggregation")
    bundlePath: str | None = Field(None, description="Optional override path to bundle .pkl")
    referencePath: str | None = Field(
        None,
        description="Optional path to X_ref/y_ref pickle (see SURVSHAP_REFERENCE env)",
    )


class SurvShapResponse(BaseModel):
    cumulative: list[dict]
    timeSeries: dict
    error: str | None = None


@app.get("/health")
def health():
    return {"ok": True}


@app.post("/api/survshap", response_model=SurvShapResponse)
def post_survshap(body: SurvShapRequest):
    try:
        bundle = Path(body.bundlePath).resolve() if body.bundlePath else None
        ref = Path(body.referencePath).resolve() if body.referencePath else None
        out = compute_survshap(
            body.rawFeatures,
            [m.model_dump() for m in body.meta],
            bundle_path=bundle,
            reference_path=ref,
        )
        return SurvShapResponse(**out, error=None)
    except Exception as e:
        tb = traceback.format_exc()
        return SurvShapResponse(
            cumulative=[],
            timeSeries={"times": [], "series": []},
            error=f"{e!s}\n\n{tb}",
        )
