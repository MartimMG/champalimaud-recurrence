"""
Compute SurvSHAP(t) explanations for the Cox model loaded from the bundle.

Expects the same pickle layout as scripts/update_model_from_pkl.py (cox_model + scaler).
"""

from __future__ import annotations

import os
import pickle
from pathlib import Path
from typing import Any

import numpy as np
import pandas as pd

from sksurv.util import Surv

try:
    from survshap import PredictSurvSHAP, SurvivalModelExplainer
except ImportError as e:  # pragma: no cover
    PredictSurvSHAP = None  # type: ignore[misc, assignment]
    SurvivalModelExplainer = None  # type: ignore[misc, assignment]
    _IMPORT_ERROR = e
else:
    _IMPORT_ERROR = None


class _ScaledCoxSurvival:
    """Wrapper: raw feature space -> MinMaxScaler -> CoxPH survival function."""

    def __init__(self, scaler, cox):
        self.scaler = scaler
        self.cox = cox

    def predict_survival_function(self, X):
        if isinstance(X, pd.DataFrame):
            Xs = self.scaler.transform(X)
        else:
            Xs = self.scaler.transform(X)
        return self.cox.predict_survival_function(Xs)


def _repo_root() -> Path:
    return Path(__file__).resolve().parent.parent


def _load_bundle(bundle_path: Path) -> dict[str, Any]:
    with open(bundle_path, "rb") as f:
        return pickle.load(f)


def _build_reference(
    feature_names: list[str],
    data_min: np.ndarray,
    data_max: np.ndarray,
    n_samples: int,
    rng: np.random.Generator,
) -> tuple[pd.DataFrame, np.ndarray]:
    """Fallback: uniform random X in feature bounds + synthetic survival labels."""
    X = np.zeros((n_samples, len(feature_names)), dtype=float)
    for j in range(len(feature_names)):
        lo = float(data_min[j])
        hi = float(data_max[j])
        if hi <= lo:
            X[:, j] = lo
        else:
            X[:, j] = rng.uniform(lo, hi, size=n_samples)
    df = pd.DataFrame(X, columns=feature_names)
    time = rng.uniform(200.0, 1825.0, size=n_samples)
    event = rng.binomial(1, 0.35, size=n_samples).astype(bool)
    y = Surv.from_arrays(event=event, time=time)
    return df, y


def _pick_xy_from_mapping(obj: dict[str, Any]) -> tuple[Any, Any] | None:
    """Resolve X_ref / y_ref from common key spellings."""
    x_keys = ("X_ref", "Xref", "x_ref", "xref", "X", "x")
    y_keys = ("y_ref", "Y_ref", "yref", "Yref", "y", "Y")
    x = next((obj[k] for k in x_keys if k in obj), None)
    y = next((obj[k] for k in y_keys if k in obj), None)
    if x is not None and y is not None:
        return x, y
    return None


def _coerce_survival_y(y_obj: Any) -> np.ndarray:
    """Return a sksurv-compatible structured survival array."""
    if isinstance(y_obj, tuple) and len(y_obj) == 2:
        e, t = y_obj
        return Surv.from_arrays(
            event=np.asarray(e).astype(bool).ravel(),
            time=np.asarray(t, dtype=float).ravel(),
        )
    y_arr = np.asarray(y_obj)
    if y_arr.dtype.names and "event" in y_arr.dtype.names and "time" in y_arr.dtype.names:
        return y_arr
    if y_arr.dtype.names and len(y_arr.dtype.names) >= 2:
        n0, n1 = y_arr.dtype.names[0], y_arr.dtype.names[1]
        return Surv.from_arrays(
            event=np.asarray(y_arr[n0]).astype(bool).ravel(),
            time=np.asarray(y_arr[n1], dtype=float).ravel(),
        )
    raise ValueError(
        "y_ref must be a sksurv structured array (event, time), two tuples (event, time), "
        f"or a structured numpy array; got {type(y_obj)}"
    )


def _parse_xy_objects(x_obj: Any, y_obj: Any, feature_names: list[str], source: str) -> tuple[pd.DataFrame, np.ndarray]:
    """Build X_ref DataFrame and survival y from loaded Python objects."""
    if isinstance(x_obj, pd.DataFrame):
        X_df = x_obj.copy()
    else:
        arr = np.asarray(x_obj, dtype=float)
        if arr.ndim != 2:
            raise ValueError(f"X_ref must be 2D, got shape {arr.shape} ({source})")
        if arr.shape[1] != len(feature_names):
            raise ValueError(
                f"X_ref has {arr.shape[1]} columns but model expects {len(feature_names)} ({source})"
            )
        X_df = pd.DataFrame(arr, columns=feature_names)

    missing = [c for c in feature_names if c not in X_df.columns]
    if missing:
        raise ValueError(
            f"X_ref missing columns ({source}): {missing[:5]}{'…' if len(missing) > 5 else ''}"
        )
    X_df = X_df[feature_names].astype(float)

    y_out = _coerce_survival_y(y_obj)
    if len(X_df) != len(y_out):
        raise ValueError(f"X_ref has {len(X_df)} rows but y_ref has {len(y_out)} ({source})")

    return X_df, y_out


def _load_reference_pkl(
    ref_path: Path,
    feature_names: list[str],
) -> tuple[pd.DataFrame, np.ndarray]:
    """
    Load training reference design matrix and survival outcomes from a pickle.

    Expected: a dict with X_ref (or Xref, X, …) and y_ref (or yref, y, …), or a tuple (X, y).
    X: pandas.DataFrame or ndarray (n × p); columns must align with model feature_names_in_.
    y: sksurv structured array or compatible (event + time).
    """
    with open(ref_path, "rb") as f:
        raw = pickle.load(f)

    x_obj: Any
    y_obj: Any

    if isinstance(raw, dict):
        picked = _pick_xy_from_mapping(raw)
        if picked is None:
            raise ValueError(
                f"Reference pickle {ref_path} is a dict but has no recognized keys. "
                f"Use e.g. X_ref + y_ref (or Xref + yref). Keys found: {list(raw.keys())}"
            )
        x_obj, y_obj = picked
    elif isinstance(raw, (list, tuple)) and len(raw) == 2:
        x_obj, y_obj = raw[0], raw[1]
    else:
        raise ValueError(
            f"Reference pickle {ref_path} must be a dict {{X_ref, y_ref}} or a (X, y) tuple; got {type(raw)}"
        )

    return _parse_xy_objects(x_obj, y_obj, feature_names, str(ref_path))


def _group_map(meta: list[dict[str, str]]) -> dict[str, str]:
    """Map training column name -> display group label."""
    return {m["name"]: m["group"] for m in meta}


def compute_survshap(
    raw_features: list[float],
    meta: list[dict[str, str]],
    *,
    bundle_path: Path | None = None,
    reference_path: Path | None = None,
    n_ref: int = 80,
    timestamps: np.ndarray | None = None,
    random_state: int = 42,
) -> dict[str, Any]:
    if _IMPORT_ERROR is not None:
        raise RuntimeError(
            "survshap is not installed or failed to import. "
            "Install server dependencies (see server/requirements.txt). "
            f"Original error: {_IMPORT_ERROR}"
        ) from _IMPORT_ERROR

    root = _repo_root()
    path = bundle_path or Path(os.environ.get("SURVSHAP_BUNDLE", str(root / "coxnet_model_bundle.pkl")))
    if not path.is_file():
        raise FileNotFoundError(f"Model bundle not found: {path}")

    bundle = _load_bundle(path)
    scaler = bundle["scaler"]
    cox = bundle["cox_model"]
    if hasattr(scaler, "feature_names_in_") and getattr(scaler, "feature_names_in_", None) is not None:
        names = [str(x) for x in np.asarray(scaler.feature_names_in_).tolist()]
    else:
        names = [str(x) for x in np.asarray(cox.feature_names_in_).tolist()]
    if len(raw_features) != len(names):
        raise ValueError(f"Expected {len(names)} raw features, got {len(raw_features)}")

    # Prefer X_ref / y_ref stored inside the model bundle (same .pkl as Cox + scaler)
    if isinstance(bundle, dict) and "X_ref" in bundle and "y_ref" in bundle:
        X_ref, y_ref = _parse_xy_objects(bundle["X_ref"], bundle["y_ref"], names, "bundle[X_ref,y_ref]")
    else:
        ref_candidates: list[Path | None] = [
            reference_path,
        ]
        if os.environ.get("SURVSHAP_REFERENCE"):
            ref_candidates.append(Path(os.environ["SURVSHAP_REFERENCE"]))
        ref_candidates.extend([root / "survshap_reference.pkl", root / "Xref_yref.pkl"])
        ref_file = next((p for p in ref_candidates if p is not None and p.is_file()), None)

        if ref_file is not None:
            X_ref, y_ref = _load_reference_pkl(ref_file, names)
        else:
            data_min = np.asarray(scaler.data_min_, dtype=float).ravel()
            data_max = np.asarray(scaler.data_max_, dtype=float).ravel()
            rng = np.random.default_rng(random_state)
            X_ref, y_ref = _build_reference(names, data_min, data_max, n_ref, rng)

    model = _ScaledCoxSurvival(scaler, cox)
    explainer = SurvivalModelExplainer(model=model, data=X_ref, y=y_ref)

    X_new = pd.DataFrame([raw_features], columns=names)

    if timestamps is None:
        # ~6-month steps for faster SHAP (full daily grid is very slow)
        timestamps = np.arange(0.0, 1826.0, 30.0)

    survshap = PredictSurvSHAP(
        function_type="sf",
        calculation_method="shap_kernel",
        aggregation_method="integral",
        random_state=random_state,
    )
    survshap.fit(explainer, new_observation=X_new, timestamps=timestamps)

    res = survshap.result
    res = res.loc[res["B"] == 0].copy()
    gmap = _group_map(meta)

    meta_cols = {"variable_str", "variable_name", "variable_value", "B", "aggregated_change"}
    time_cols = [c for c in res.columns if c not in meta_cols]

    # Cumulative importance per group (sum of SurvSHAP integral metric across OHE columns)
    res = res.assign(_group=res["variable_name"].map(lambda n: gmap.get(str(n), str(n))))
    cum = (
        res.groupby("_group", as_index=False)["aggregated_change"]
        .sum()
        .rename(columns={"_group": "displayName", "aggregated_change": "importance"})
        .sort_values("importance", ascending=False)
    )

    # Time-dependent impact: sum signed SHAP per group at each time
    series_by_group: dict[str, list[float]] = {}
    for gname, sub in res.groupby("_group"):
        mat = sub[time_cols].values
        summed = np.sum(mat, axis=0)
        series_by_group[str(gname)] = [float(x) for x in summed]

    times_out = [float(c.split("=", 1)[1].strip()) for c in time_cols]

    return {
        "cumulative": cum.to_dict(orient="records"),
        "timeSeries": {
            "times": times_out,
            "series": [{"displayName": k, "values": v} for k, v in series_by_group.items()],
        },
    }
