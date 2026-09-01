#!/usr/bin/env python3
# Run in an environment with the REAL scikit-learn / scikit-survival installed (versions
# recorded in bundle["threshold_config"]["library_versions"]) -- not the numpy/pandas-only
# venv used by update_model_from_pkl.py.
# python scripts/generate_parity_fixture.py --bundle coxnet_model_bundle.pkl --output src/test/modelParity.fixture.json

"""Regenerate src/test/modelParity.fixture.json from the real pickled model.

update_model_from_pkl.py never actually reconstructs the pickled CoxnetSurvivalAnalysis --
it deliberately swallows the class and recovers only the raw arrays inside it (coefficients,
scaler params, baseline hazard) via a forgiving unpickler, so it can run with just numpy and
pandas installed. That's fine for producing coxModel.ts, but it means coxModel.ts's risk
formula is a hand-written TypeScript reimplementation of the Cox + Breslow math, never
verified against the model's own real prediction code.

This script is that verification. It fully unpickles the bundle (so it needs the real
libraries installed) and scores bundle["X_ref"] through the model's own
predict_survival_function, independent of anything coxModel.ts or update_model_from_pkl.py
compute. Generating the fixture any other way -- e.g. re-deriving the same formula in
Python -- would be circular and defeat its purpose as a regression test.
"""

import argparse
import json
import pickle
import sys
from pathlib import Path

import numpy as np

sys.path.insert(0, str(Path(__file__).parent))
import update_model_from_pkl as base  # noqa: E402  (reuse the candidate-variable lists so the fixture's PatientInput shape can never drift from coxModel.ts's)

REPORT_DAYS = [365, 730, 1095, 1460, 1825]


def resample_thresholds(thresholds_df, times: list[float], avg_col: str):
    """Same step-function lookup as build_model_data() in update_model_from_pkl.py."""
    threshold_times = np.asarray(thresholds_df["time"], dtype=float)
    idx = np.searchsorted(threshold_times, np.asarray(times, dtype=float), side="right") - 1
    idx = np.clip(idx, 0, len(threshold_times) - 1)
    low = np.asarray(thresholds_df["t_low"], dtype=float)[idx]
    high = np.asarray(thresholds_df["t_high"], dtype=float)[idx]
    avg = np.asarray(thresholds_df[avg_col], dtype=float)[idx]
    return low, avg, high


def zone_for(risk: float, low: float, avg: float, high: float) -> str:
    """Mirrors getRiskCategory() in coxModel.ts exactly, including the day-75 tie rule."""
    if risk == 0 and low == 0:
        return "low"
    if risk < low:
        return "low"
    if risk < avg:
        return "intermediate"
    if risk < high:
        return "average"
    return "high"


def row_to_patient_input(row, feature_names: set[str], scaler_lookup: dict) -> dict:
    """Collapse one X_ref row (already scaled / one-hot) back into the app's PatientInput shape."""
    patient: dict = {}

    for b in base.BINARY_VARIABLES:
        if b in feature_names:
            patient[base.slugify(b)] = int(round(float(row[b])))

    for c in base.CONTINUOUS_VARIABLES:
        if c in feature_names:
            _dmin, _dmax, scale, smin = scaler_lookup[c]
            scaled = float(row[c])
            raw = (scaled - smin) / scale if scale else scaled
            patient[base.slugify(c)] = raw

    for group_name, cols in base.OHE_COLUMNS.items():
        active_cols = [col for col in cols if col in feature_names]
        if not active_cols:
            continue
        gkey = base.slugify(group_name)
        value = base.ohe_default_value(group_name)
        for col in active_cols:
            if round(float(row[col])) == 1:
                value = base.ohe_suffix(group_name, col).replace(".0", "")
                break
        patient[gkey] = value

    for group_name, spec in base.VIRTUAL_GROUPS.items():
        present = {v: col for v, col in spec["columns"].items() if col in feature_names}
        if not present:
            continue
        gkey = base.slugify(group_name)
        value = spec["default"]
        for v, col in present.items():
            if round(float(row[col])) == 1:
                value = v
                break
        patient[gkey] = value

    return patient


def select_case_positions(risks_1825: np.ndarray, n_cases: int) -> list[int]:
    """Evenly spaced across the risk spectrum (not random), so the sample reliably spans
    every zone the way the "exercises all four zones" test in modelParity.test.ts requires,
    regardless of how skewed X_ref's zone distribution is."""
    n = len(risks_1825)
    if n_cases >= n:
        return list(range(n))
    order = np.argsort(risks_1825)
    picks = np.linspace(0, n - 1, n_cases)
    positions = sorted({int(order[int(round(p))]) for p in picks})
    return positions


def main():
    parser = argparse.ArgumentParser(
        description="Score bundle['X_ref'] through the real pickled model into modelParity.fixture.json"
    )
    parser.add_argument("--bundle", default="coxnet_model_bundle.pkl", help="Path to model bundle .pkl")
    parser.add_argument("--output", default="src/test/modelParity.fixture.json", help="Output JSON path")
    parser.add_argument("--n-cases", type=int, default=40, help="Number of reference patients to include")
    args = parser.parse_args()

    with open(args.bundle, "rb") as f:
        bundle = pickle.load(f)  # real classes: requires scikit-learn/scikit-survival installed

    cox_model = bundle["cox_model"]
    scaler = bundle["scaler"]
    X_ref = bundle["X_ref"]
    thresholds_df = bundle["thresholds_df"]

    feature_names = set(str(x) for x in cox_model.feature_names_in_)
    scaler_names = list(scaler.feature_names_in_)
    scaler_lookup = {
        name: (
            float(scaler.data_min_[i]),
            float(scaler.data_max_[i]),
            float(scaler.scale_[i]),
            float(scaler.min_[i]),
        )
        for i, name in enumerate(scaler_names)
    }

    avg_col = base.find_threshold_average_column(thresholds_df)
    low_arr, avg_arr, high_arr = resample_thresholds(thresholds_df, REPORT_DAYS, avg_col)

    surv_funcs = cox_model.predict_survival_function(X_ref)

    all_risks = np.zeros((len(X_ref), len(REPORT_DAYS)))
    for pos, sf in enumerate(surv_funcs):
        for k, day in enumerate(REPORT_DAYS):
            all_risks[pos, k] = 1.0 - float(sf(np.array([day], dtype=float))[0])

    positions = select_case_positions(all_risks[:, -1], args.n_cases)

    cases = []
    for pos in positions:
        row = X_ref.iloc[pos]
        risks = all_risks[pos].tolist()
        zones = [
            zone_for(r, low_arr[k], avg_arr[k], high_arr[k]) for k, r in enumerate(risks)
        ]
        cases.append(
            {
                "input": row_to_patient_input(row, feature_names, scaler_lookup),
                "risks": risks,
                "zones": zones,
            }
        )

    low_1825, avg_1825, high_1825 = resample_thresholds(thresholds_df, [1825], avg_col)
    output = {
        "reportDays": REPORT_DAYS,
        "cases": cases,
        "thresholdsAt1825": {
            "low": float(low_1825[0]),
            "intermediate": float(avg_1825[0]),
            "high": float(high_1825[0]),
        },
    }

    zones_seen = {c["zones"][-1] for c in cases}
    missing = {"low", "intermediate", "average", "high"} - zones_seen
    if missing:
        print(
            f"WARNING: selected cases don't cover zone(s) {sorted(missing)} at day 1825 -- "
            "modelParity.test.ts's 'exercises all four zones' check will fail. Try a larger --n-cases.",
            file=sys.stderr,
        )

    out_path = Path(args.output)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(output, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {len(cases)} cases to {out_path}")


if __name__ == "__main__":
    main()
