#!/usr/bin/env python3
# .\.venv\Scripts\Activate.ps1
# python scripts/update_model_from_pkl.py --bundle coxnet_model_bundle.pkl --output src/lib/coxModel.ts
# npm run build

import argparse
import pickle
import re
from pathlib import Path
from typing import Any

import numpy as np

# --- Canonical variable names (must match training column names in the .pkl) ---

BINARY_VARIABLES = [
    "Radiotherapy (RT) performed",
    "Radiotherapy on chest wall",
    "Radiotherapy on supraclavicular area",
    "Radiotherapy on internal mammary chain",
    "State (if hormone therapy prescribed)",
    "Treatment in association with chemotherapy",
    "Chemotherapy performed",
    "Adjuvant chemotherapy",
    "Type of invasion at CB",
    "Oestrogen receptor status at CB",
    "Progesterone receptor status at CB",
    "Side location of the lesion"
]

# Binary variables whose UI default is 1 rather than 0.
BINARY_DEFAULT_ONE = {
    # Oestrogen receptor status is a plain 0/1 column in the current bundle, and 0 is
    # the high-risk branch (coef is large and protective). Defaulting to 0 would open
    # the form on a red patient; positive is also the training majority (2655/3228).
    "Oestrogen receptor status at CB",
}

# Model columns that are deliberately never surfaced in the UI. They are derived from
# which diagnostic fields were missing at training time, so a user of the calculator has
# nothing to enter for them. They carry zero coefficients in the current bundle; if that
# ever changes, assert_all_nonzero_emitted() below will stop the build rather than let
# the app quietly ignore a live predictor.
EXCLUDED_COLUMNS = [
    "Diagnostic panel missingness pattern_missing_3",
    "Diagnostic panel missingness pattern_missing_7",
]

CONTINUOUS_VARIABLES = [
    "Conventional RT fraction",
    "Total administered dose",
    "Boost dose administered",
    "Age",
    "Ki67 positive cells (%) at CB",
]

OHE_COLUMNS: dict[str, list[str]] = {
    "Grade at CB": [
        "Grade at CB_2.0",
        "Grade at CB_3.0",
    ],
    "N (Regional nodes affected)": [
        "N (Regional nodes affected)_1.0",
        "N (Regional nodes affected)_23.0",
    ],
    # The bundle dropped the _1.0 column, so "Negative (0/1+)" is now the implicit
    # baseline (all one-hot columns zero) rather than a column of its own.
    "Her2 overexpression (with immunohystochemistry) at CB": [
        "Her2 overexpression (with immunohystochemistry) at CB_2.0",
        "Her2 overexpression (with immunohystochemistry) at CB_3.0",
    ],
    "Isotype at CB": [
        "Isotype at CB_2.0",
        "Isotype at CB_3.0",
        "Isotype at CB_4.0",
    ],
}

# Groups whose member columns are separate binaries in the bundle rather than a
# prefixed one-hot block, but which are mutually exclusive and so behave as one
# categorical. Rendered as a single Select, which makes the illegal combinations
# unrepresentable instead of merely discouraged.
#
# "options" is (label, value); a value with no entry in "columns" is the baseline
# (every member column zero).
VIRTUAL_GROUPS: dict[str, dict] = {
    # "Neoadjuvant (Only)" means neoadjuvant *without* adjuvant, so a patient who had
    # both sits in the Adjuvant column. Training bears this out: none 2665,
    # adjuvant 381, neoadjuvant-only 182, both 0.
    "Biological therapy": {
        "columns": {
            "neo": "Neoadjuvant (Only) therapy with biological drugs",
            "adj": "Adjuvant therapy using biological drugs",
        },
        "options": [("None", "none"), ("Neoadjuvant", "neo"), ("Adjuvant or both", "adj")],
        "default": "none",
    },
}


# Canonical names (or, for grouped variables, group names) that describe a treatment
# rather than a diagnostic/tumour/patient characteristic. Drives whether a feature's
# displayed contribution is centred on its fitting-sample mean (see FeatureSpec.category
# and computeRisk in write_ts): centring is applied only to diagnostic variables.
TREATMENT_VARIABLES = {
    "Radiotherapy (RT) performed",
    "Radiotherapy on chest wall",
    "Radiotherapy on supraclavicular area",
    "Radiotherapy on internal mammary chain",
    "State (if hormone therapy prescribed)",
    "Treatment in association with chemotherapy",
    "Chemotherapy performed",
    "Adjuvant chemotherapy",
    "Conventional RT fraction",
    "Total administered dose",
    "Boost dose administered",
    "Biological therapy",
}


def category_for(name: str) -> str:
    return "treatment" if name in TREATMENT_VARIABLES else "diagnostic"


def ohe_suffix(group_name: str, column_name: str) -> str:
    prefix = group_name + "_"
    assert column_name.startswith(prefix), (group_name, column_name)
    return column_name[len(prefix) :]


class Placeholder:
    def __init__(self, *args, **kwargs):
        pass

    def __setstate__(self, state):
        self.__dict__["_state"] = state


class ForgivingUnpickler(pickle.Unpickler):
    def find_class(self, module, name):
        try:
            return super().find_class(module, name)
        except Exception:
            return Placeholder


def slugify(value: str) -> str:
    value = value.lower().strip()
    value = re.sub(r"[^a-z0-9]+", "_", value)
    value = re.sub(r"_+", "_", value).strip("_")
    return value


def to_float_list(arr: Any) -> list[float]:
    return [float(x) for x in np.asarray(arr).tolist()]


def find_threshold_average_column(thresholds_df: Any) -> str:
    """The bundle's intermediate (middle) threshold column.

    Deliberately has no midpoint fallback: the bundle derives this boundary from its own
    rule (threshold_config["medium_rule"], currently "mean_risk"), and silently
    substituting (t_low + t_high) / 2 would shift the yellow/orange band away from the
    zone assignment the bundle itself reports.
    """
    candidates = (
        "t_intermediate",
        "t_avg",
        "t_average",
        "t_mean",
        "t_mid",
    )
    for name in candidates:
        if name in thresholds_df:
            return name
    raise SystemExit(
        "thresholds_df has no intermediate threshold column (looked for "
        + ", ".join(candidates)
        + "). Columns present: "
        + ", ".join(str(c) for c in thresholds_df.columns)
    )


def fmt_number(x: float) -> str:
    """Shortest representation that round-trips the float64 exactly.

    repr() of a Python float and JS Number parsing are both IEEE-754 shortest-round-trip,
    so the generated constants deserialise bit-identical to the values in the bundle.
    Formatting to a fixed number of significant figures instead would quietly shift the
    thresholds, which matters at the zone boundaries where a comparison is exact.
    """
    x = float(x)
    if np.isnan(x):
        return "0"
    text = repr(x)
    if "e" not in text and "." not in text:
        return text + ".0"
    return text


def ts_array(nums: list[float]) -> str:
    return "[" + ",".join(fmt_number(v) for v in nums) + "]"


def ts_string(value: str) -> str:
    return '"' + value.replace("\\", "\\\\").replace('"', '\\"') + '"'


def build_ohe_ui_options(
    group_name: str, active_suffixes: list[str]
) -> list[tuple[str, str]]:
    """(label, value) for Select; filtered to active columns + sentinels."""
    sset = set(active_suffixes)

    if group_name == "Grade at CB":
        # Training encoding uses Grade 1 as the implicit baseline (all one-hot cols 0).
        # Only include suffixes that exist in the loaded model.
        # No "Unknown" option for Grade in the UI.
        out = [("1", "1")]
        if "2.0" in sset:
            out.append(("2", "2"))
        if "3.0" in sset:
            out.append(("3", "3"))
        return out

    if group_name == "N (Regional nodes affected)":
        # UI semantics:
        # - "0" => baseline (all one-hot columns are 0)
        # - "1" => activate the "_1.0" column only (if present in the model)
        # - "2+" => activate the "_23.0" column only (if present in the model)
        out = [("0", "0")]
        if "1.0" in sset:
            out.append(("1", "1"))
        if "23.0" in sset:
            out.append(("2+", "23"))
        return out
    if group_name == "Her2 overexpression (with immunohystochemistry) at CB":
        # "Negative (0/1+)" is the implicit baseline now that the _1.0 column is gone.
        suf_map = {
            "2.0": ("Dubious (2+)", "2"),
            "3.0": ("Positive (3+)", "3"),
        }
        out = [("Negative (0/1+)", "1")]
        for suf in ("2.0", "3.0"):
            if suf in sset:
                out.append(suf_map[suf])
        return out
    if group_name == "Isotype at CB":
        suf_map = {
            "2.0": ("Lobular", "2"),
            "3.0": ("Tubular", "3"),
            "4.0": ("Other", "4"),
        }
        out = [("Ductal", "1")]
        for suf in ("2.0", "3.0", "4.0"):
            if suf in sset:
                out.append(suf_map[suf])
        return out
    raise ValueError(f"Unknown OHE group: {group_name}")


def ohe_default_value(group_name: str) -> str:
    """The baseline level for a group: the value where every one-hot column is 0."""
    if group_name in (
        "Grade at CB",
        "Her2 overexpression (with immunohystochemistry) at CB",
        "Isotype at CB",
    ):
        return "1"
    if group_name == "N (Regional nodes affected)":
        return "0"
    raise ValueError(f"Unknown OHE group: {group_name}")


def emit_get_raw_value_body(active_ohe_keys: set[str], active_virtual_keys: set[str]) -> str:
    """TypeScript switch cases for grouped variables (by slug inputKey)."""
    blocks: dict[str, str] = {
        slugify("Grade at CB"): """      if (s === "2.0") return v === "2" ? 1 : 0;
      if (s === "3.0") return v === "3" ? 1 : 0;
      return 0;""",
        slugify("Her2 overexpression (with immunohystochemistry) at CB"): """      if (s === "2.0") return v === "2" ? 1 : 0;
      if (s === "3.0") return v === "3" ? 1 : 0;
      return 0;""",
        slugify("N (Regional nodes affected)"): """      if (s === "1.0") return v === "1" ? 1 : 0;
      if (s === "23.0") return v === "23" ? 1 : 0;
      return 0;""",
        slugify("Isotype at CB"): """      if (s === "2.0") return v === "2" ? 1 : 0;
      if (s === "3.0") return v === "3" ? 1 : 0;
      if (s === "4.0") return v === "4" ? 1 : 0;
      return 0;""",
    }
    # Virtual groups carry the activating option value itself in oheSuffix, so one
    # comparison covers every member column.
    for key in sorted(active_virtual_keys):
        blocks[key] = """      return v === s ? 1 : 0;"""

    lines: list[str] = []
    for key in sorted(active_ohe_keys | active_virtual_keys):
        if key not in blocks:
            continue
        lines.append(f"    case {ts_string(key)}:")
        lines.append(blocks[key])
    lines.append("    default:")
    lines.append("      return 0;")
    return "\n".join(lines)


def assert_all_nonzero_emitted(
    feature_names: list[str], coefs_raw: Any, emitted: set[str]
) -> None:
    """Stop the build if a live predictor never made it into the generated file.

    The name lists above are hand-maintained, so a bundle that renames or reshapes a
    column would otherwise produce a TypeScript file that scores confidently but wrongly.
    """
    missing = [
        name
        for i, name in enumerate(feature_names)
        if abs(float(coefs_raw[i])) > 1e-12 and name not in emitted
    ]
    if missing:
        raise SystemExit(
            "Bundle has non-zero coefficients for columns this script does not emit:\n"
            + "\n".join(f"  - {name}" for name in missing)
            + "\n\nAdd each to BINARY_VARIABLES, CONTINUOUS_VARIABLES, OHE_COLUMNS or "
            "VIRTUAL_GROUPS (or to EXCLUDED_COLUMNS if it is intentionally not a UI field)."
        )

    live_exclusions = [
        name
        for name in EXCLUDED_COLUMNS
        if name in feature_names
        and abs(float(coefs_raw[feature_names.index(name)])) > 1e-12
    ]
    if live_exclusions:
        raise SystemExit(
            "These columns are in EXCLUDED_COLUMNS but now carry a non-zero coefficient, "
            "so excluding them would change every prediction:\n"
            + "\n".join(f"  - {name}" for name in live_exclusions)
        )


def build_model_data(bundle: dict[str, Any]) -> dict[str, Any]:
    cox_state = bundle["cox_model"]._state
    scaler_state = bundle["scaler"]._state

    feature_names = [str(x) for x in np.asarray(cox_state["feature_names_in_"]).tolist()]
    feature_name_set = set(feature_names)
    name_to_idx = {n: i for i, n in enumerate(feature_names)}
    coefs_raw = np.asarray(cox_state["coef_"]).reshape(-1)
    scaler_feature_names = [str(x) for x in np.asarray(scaler_state["feature_names_in_"]).tolist()]
    scaler_name_to_idx = {n: i for i, n in enumerate(scaler_feature_names)}
    data_min = np.asarray(scaler_state["data_min_"]).reshape(-1)
    data_max = np.asarray(scaler_state["data_max_"]).reshape(-1)
    scaler_scale = np.asarray(scaler_state["scale_"]).reshape(-1)
    scaler_min = np.asarray(scaler_state["min_"]).reshape(-1)

    # Fitting-sample mean of each model column, in the same (scaled) space computeRisk
    # works in, used to centre diagnostic-variable contributions for display: c_j =
    # coef_j * (x_j - mean_j). x_train_scaled is the training design matrix already run
    # through the scaler, with columns in the same order as feature_names_in_.
    x_train_scaled = bundle["x_train_scaled"]
    column_means = x_train_scaled.mean()

    def row_for(name: str) -> dict[str, Any]:
        i = name_to_idx[name]
        scaler_idx = scaler_name_to_idx.get(name)
        if scaler_idx is None:
            data_min_value = 0.0
            data_max_value = 1.0
            scaler_scale_value = 1.0
            scaler_min_value = 0.0
        else:
            data_min_value = float(data_min[scaler_idx])
            data_max_value = float(data_max[scaler_idx])
            scaler_scale_value = float(scaler_scale[scaler_idx])
            scaler_min_value = float(scaler_min[scaler_idx])
        return {
            "name": name,
            "coef": float(coefs_raw[i]),
            "dataMin": data_min_value,
            "dataMax": data_max_value,
            "scalerScale": scaler_scale_value,
            "scalerMin": scaler_min_value,
            "dataMean": float(column_means[name]),
        }

    nonzero = {feature_names[i] for i in range(len(feature_names)) if abs(float(coefs_raw[i])) > 1e-12}

    features: list[dict[str, Any]] = []
    binary_switch: list[dict[str, str]] = []
    continuous_inputs: list[dict[str, Any]] = []
    ohe_ui: list[dict[str, Any]] = []
    active_ohe_keys: set[str] = set()
    active_virtual_keys: set[str] = set()
    defaults: dict[str, Any] = {}

    for b in BINARY_VARIABLES:
        if b not in nonzero:
            continue
        r = row_for(b)
        r["inputKey"] = slugify(b)
        r["category"] = category_for(b)
        features.append(r)
        binary_switch.append({"key": r["inputKey"], "label": b})
        defaults[r["inputKey"]] = 1 if b in BINARY_DEFAULT_ONE else 0

    for c in CONTINUOUS_VARIABLES:
        if c not in nonzero:
            continue
        r = row_for(c)
        r["inputKey"] = slugify(c)
        r["category"] = category_for(c)
        features.append(r)
        continuous_inputs.append(
            {
                "key": r["inputKey"],
                "label": c,
                "min": r["dataMin"],
                "max": r["dataMax"],
            }
        )
        defaults[r["inputKey"]] = float(r["dataMin"])

    for group_name, cols in OHE_COLUMNS.items():
        # Show an OHE variable only if at least one category is actually used (non-zero coef).
        used_cols = [col for col in cols if col in nonzero]
        if not used_cols:
            continue
        # But once shown, include all categories that exist in the model bundle,
        # even if their coefficient is zero (so the UI can show the full option set).
        active_cols = [col for col in cols if col in feature_name_set]
        if not active_cols:
            continue
        gkey = slugify(group_name)
        active_ohe_keys.add(gkey)
        active_suffixes = [ohe_suffix(group_name, col) for col in active_cols]

        for col in active_cols:
            r = row_for(col)
            r["inputKey"] = gkey
            r["groupName"] = group_name
            r["oheSuffix"] = ohe_suffix(group_name, col)
            r["category"] = category_for(group_name)
            features.append(r)

        opts = build_ohe_ui_options(group_name, active_suffixes)
        ohe_ui.append(
            {
                "key": gkey,
                "label": group_name,
                "options": [{"label": a, "value": b} for a, b in opts],
            }
        )
        defaults[gkey] = ohe_default_value(group_name)

    for group_name, spec in VIRTUAL_GROUPS.items():
        # Same rule as OHE groups: show the control if any member column is live, then
        # carry every member that exists in the bundle so the option set stays complete.
        present = {
            value: col for value, col in spec["columns"].items() if col in feature_name_set
        }
        if not any(col in nonzero for col in present.values()):
            continue
        gkey = slugify(group_name)
        active_virtual_keys.add(gkey)

        for value, col in present.items():
            r = row_for(col)
            r["inputKey"] = gkey
            r["groupName"] = group_name
            # For a virtual group the "suffix" is the option value that turns this
            # column on, since the columns share no common name prefix.
            r["oheSuffix"] = value
            r["category"] = category_for(group_name)
            features.append(r)

        ohe_ui.append(
            {
                "key": gkey,
                "label": group_name,
                "options": [
                    {"label": label, "value": value}
                    for label, value in spec["options"]
                    if value not in spec["columns"] or value in present
                ],
            }
        )
        defaults[gkey] = spec["default"]

    assert_all_nonzero_emitted(feature_names, coefs_raw, {f["name"] for f in features})

    baseline_model = cox_state["_baseline_models"][0]._state
    cum_hazard_state = baseline_model["cum_baseline_hazard_"]._state
    baseline_times = to_float_list(np.arange(0, 1826, 5))
    times = np.array(baseline_times, dtype=float)
    x = np.asarray(cum_hazard_state["x"], dtype=float)
    y = np.asarray(cum_hazard_state["y"], dtype=float)

    idx = np.searchsorted(x, times, side="right") - 1
    idx = np.clip(idx, 0, len(y) - 1)
    baseline_cum_hazards = y[idx].tolist()
    baseline_cum_hazards = [0.0 if t < float(x[0]) else float(v) for t, v in zip(times, baseline_cum_hazards)]

    thresholds_df = bundle["thresholds_df"]
    threshold_times = np.asarray(thresholds_df["time"], dtype=float)
    threshold_low_vals = np.asarray(thresholds_df["t_low"], dtype=float)
    threshold_high_vals = np.asarray(thresholds_df["t_high"], dtype=float)
    threshold_avg_col = find_threshold_average_column(thresholds_df)
    threshold_average_vals = np.asarray(thresholds_df[threshold_avg_col], dtype=float)
    t_idx = np.searchsorted(threshold_times, times, side="right") - 1
    t_idx = np.clip(t_idx, 0, len(threshold_times) - 1)
    threshold_low = threshold_low_vals[t_idx].tolist()
    threshold_high = threshold_high_vals[t_idx].tolist()
    threshold_average = threshold_average_vals[t_idx].tolist()

    return {
        "features": features,
        "offset": float(np.asarray(cox_state["offset_"]).reshape(-1)[0]),
        "baseline_times": baseline_times,
        "baseline_cum_hazards": baseline_cum_hazards,
        "threshold_low": threshold_low,
        "threshold_high": threshold_high,
        "threshold_average": threshold_average,
        "binary_switch": binary_switch,
        "continuous_inputs": continuous_inputs,
        "ohe_ui": ohe_ui,
        "active_ohe_keys": active_ohe_keys,
        "active_virtual_keys": active_virtual_keys,
        "defaults": defaults,
    }


def write_ts(data: dict[str, Any], output_path: Path) -> None:
    lines: list[str] = []
    lines.append("// AUTO-GENERATED by scripts/update_model_from_pkl.py")
    lines.append("// Do not edit manually; regenerate from the model bundle.")
    lines.append("")
    lines.append("export interface FeatureSpec {")
    lines.append("  name: string;")
    lines.append("  coef: number;")
    lines.append("  dataMin: number;")
    lines.append("  dataMax: number;")
    lines.append("  scalerScale: number;")
    lines.append("  scalerMin: number;")
    lines.append("  dataMean: number;")
    lines.append("  category: \"diagnostic\" | \"treatment\";")
    lines.append("  inputKey: string;")
    lines.append("  groupName?: string;")
    lines.append("  oheSuffix?: string;")
    lines.append("}")
    lines.append("")
    lines.append("export const FEATURES: FeatureSpec[] = [")
    for f in data["features"]:
        parts = [
            f"name: {ts_string(f['name'])}",
            f"coef: {fmt_number(f['coef'])}",
            f"dataMin: {fmt_number(f['dataMin'])}",
            f"dataMax: {fmt_number(f['dataMax'])}",
            f"scalerScale: {fmt_number(f['scalerScale'])}",
            f"scalerMin: {fmt_number(f['scalerMin'])}",
            f"dataMean: {fmt_number(f['dataMean'])}",
            f"category: {ts_string(f['category'])}",
            f"inputKey: {ts_string(f['inputKey'])}",
        ]
        if "groupName" in f:
            parts.append(f"groupName: {ts_string(f['groupName'])}")
            parts.append(f"oheSuffix: {ts_string(f['oheSuffix'])}")
        lines.append("  { " + ", ".join(parts) + " },")
    lines.append("];")
    lines.append("")
    lines.append(f"export const MODEL_OFFSET = {fmt_number(data['offset'])};")
    lines.append(f"export const BASELINE_TIMES = {ts_array(data['baseline_times'])};")
    lines.append(f"export const BASELINE_CUM_HAZARDS = {ts_array(data['baseline_cum_hazards'])};")
    lines.append(f"export const THRESHOLD_LOW = {ts_array(data['threshold_low'])};")
    lines.append(f"export const THRESHOLD_HIGH = {ts_array(data['threshold_high'])};")
    lines.append(f"export const THRESHOLD_AVERAGE = {ts_array(data['threshold_average'])};")
    lines.append("")
    # These catalogues are annotated rather than `as const`: `[] as const` has element
    # type `never`, so any .map() over one breaks as soon as a bundle leaves it empty.
    lines.append("export interface SwitchVariable {")
    lines.append("  key: string;")
    lines.append("  label: string;")
    lines.append("}")
    lines.append("")
    lines.append("export interface ContinuousVariable {")
    lines.append("  key: string;")
    lines.append("  label: string;")
    lines.append("  min: number;")
    lines.append("  max: number;")
    lines.append("}")
    lines.append("")
    lines.append("export interface SelectVariable {")
    lines.append("  key: string;")
    lines.append("  label: string;")
    lines.append("  options: readonly { label: string; value: string }[];")
    lines.append("}")
    lines.append("")
    lines.append("export const BINARY_SWITCH_VARIABLES: readonly SwitchVariable[] = [")
    for v in data["binary_switch"]:
        lines.append(f"  {{ key: {ts_string(v['key'])}, label: {ts_string(v['label'])} }},")
    lines.append("];")
    lines.append("")
    lines.append("export const CONTINUOUS_INPUT_VARIABLES: readonly ContinuousVariable[] = [")
    for v in data["continuous_inputs"]:
        lines.append(
            f"  {{ key: {ts_string(v['key'])}, label: {ts_string(v['label'])}, min: {fmt_number(v['min'])}, max: {fmt_number(v['max'])} }},"
        )
    lines.append("];")
    lines.append("")
    lines.append("export const OHE_UI_VARIABLES: readonly SelectVariable[] = [")
    for cat in data["ohe_ui"]:
        lines.append(f"  {{ key: {ts_string(cat['key'])}, label: {ts_string(cat['label'])}, options: [")
        for opt in cat["options"]:
            lines.append(f"    {{ label: {ts_string(opt['label'])}, value: {ts_string(opt['value'])} }},")
        lines.append("  ] },")
    lines.append("];")
    lines.append("")
    lines.append("export interface PatientInput {")
    for k, v in data["defaults"].items():
        t = "string" if isinstance(v, str) else "number"
        lines.append(f"  {k}: {t};")
    lines.append("}")
    lines.append("")
    lines.append("export const DEFAULT_INPUT: PatientInput = {")
    for k, v in data["defaults"].items():
        if isinstance(v, str):
            lines.append(f"  {k}: {ts_string(v)},")
        else:
            if isinstance(v, float):
                lines.append(f"  {k}: {fmt_number(v)},")
            else:
                lines.append(f"  {k}: {v},")
    lines.append("};")
    lines.append("")
    lines.append("export const REPORT_YEARS = [1,2,3,4,5];")
    lines.append("export const REPORT_DAYS = [365,730,1095,1460,1825];")
    lines.append("")
    lines.append("function scaleFeature(value: number, scalerScale: number, scalerMin: number): number {")
    lines.append("  return value * scalerScale + scalerMin;")
    lines.append("}")
    lines.append("")
    lines.append("export interface FeatureContribution {")
    lines.append("  name: string;")
    lines.append("  coefficient: number;")
    lines.append("  scaledValue: number;")
    lines.append("  contribution: number;")
    lines.append("}")
    lines.append("")
    lines.append('export type RiskCategory = "low" | "intermediate" | "average" | "high";')
    lines.append("")
    lines.append("// Zone rule as shipped in the bundle's threshold_config: strict < at every")
    lines.append("// boundary, mapping onto zone_1_low / zone_2_mid_low / zone_3_mid_high / zone_4_high.")
    lines.append("export function getRiskCategory(risk: number, timeIndex: number): RiskCategory {")
    lines.append('  if (timeIndex < 0 || timeIndex >= THRESHOLD_LOW.length) return "average";')
    lines.append("  // Before the first observed event (day 75) every boundary sits at 0. A 0 == 0")
    lines.append("  // tie is not a crossing, so it resolves to the lowest zone rather than the top one.")
    lines.append('  if (risk === 0 && THRESHOLD_LOW[timeIndex] === 0) return "low";')
    lines.append('  if (risk < THRESHOLD_LOW[timeIndex]) return "low";')
    lines.append('  if (risk < THRESHOLD_AVERAGE[timeIndex]) return "intermediate";')
    lines.append('  if (risk < THRESHOLD_HIGH[timeIndex]) return "average";')
    lines.append('  return "high";')
    lines.append("}")
    lines.append("")
    lines.append("function getRawValue(input: PatientInput, spec: FeatureSpec): number {")
    lines.append("  if (spec.oheSuffix === undefined) {")
    lines.append("    const value = input[spec.inputKey as keyof PatientInput];")
    lines.append("    return Number(value ?? spec.dataMin);")
    lines.append("  }")
    lines.append('  const v = String(input[spec.inputKey as keyof PatientInput]);')
    lines.append("  const s = spec.oheSuffix;")
    lines.append("  switch (spec.inputKey) {")
    lines.append(emit_get_raw_value_body(data["active_ohe_keys"], data["active_virtual_keys"]))
    lines.append("  }")
    lines.append("}")
    lines.append("")
    lines.append("export function computeRisk(input: PatientInput) {")
    lines.append("  const contributions: FeatureContribution[] = [];")
    lines.append("  let linearPredictor = 0;")
    lines.append("")
    lines.append("  for (const spec of FEATURES) {")
    lines.append("    const rawValue = getRawValue(input, spec);")
    lines.append("    const scaled = scaleFeature(rawValue, spec.scalerScale, spec.scalerMin);")
    lines.append("    const rawContribution = spec.coef * scaled;")
    lines.append("    linearPredictor += rawContribution;")
    lines.append("")
    lines.append("    // Displayed contributions are centred on the fitting-sample mean for")
    lines.append("    // diagnostic variables only, so the chart reads as \"above/below the average")
    lines.append("    // model profile\" rather than just \"non-reference category active\". Treatment")
    lines.append("    // variables keep the uncentred contribution. linearPredictor above always uses")
    lines.append("    // the uncentred value, so this choice never affects the computed risk.")
    lines.append("    const displayContribution =")
    lines.append("      spec.category === \"diagnostic\" ? spec.coef * (scaled - spec.dataMean) : rawContribution;")
    lines.append("")
    lines.append("    const displayName = spec.groupName || spec.name;")
    lines.append("    const existing = contributions.find((c) => c.name === displayName);")
    lines.append("    if (existing) {")
    lines.append("      existing.contribution += displayContribution;")
    lines.append("      existing.scaledValue = Math.max(existing.scaledValue, scaled);")
    lines.append("    } else {")
    lines.append("      contributions.push({ name: displayName, coefficient: spec.coef, scaledValue: scaled, contribution: displayContribution });")
    lines.append("    }")
    lines.append("  }")
    lines.append("")
    lines.append("  contributions.sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution));")
    lines.append("  const expFactor = Math.exp(linearPredictor - MODEL_OFFSET);")
    lines.append("")
    lines.append("  const survivalCurve = BASELINE_TIMES.map((t, i) => {")
    lines.append("    const H0 = BASELINE_CUM_HAZARDS[i];")
    lines.append("    const survival = Math.exp(-H0 * expFactor);")
    lines.append("    const risk = 1 - survival;")
    lines.append("    return {")
    lines.append("      time: t,")
    lines.append("      survival,")
    lines.append("      risk,")
    lines.append("      thresholdLow: THRESHOLD_LOW[i],")
    lines.append("      thresholdHigh: THRESHOLD_HIGH[i],")
    lines.append("      thresholdAverage: THRESHOLD_AVERAGE[i],")
    lines.append("      category: getRiskCategory(risk, i),")
    lines.append("    };")
    lines.append("  });")
    lines.append("")
    lines.append("  const yearlyRisk = REPORT_DAYS.map((days, i) => {")
    lines.append("    const idx = Math.min(Math.floor(days / 5), BASELINE_TIMES.length - 1);")
    lines.append("    const H0 = BASELINE_CUM_HAZARDS[idx];")
    lines.append("    const survival = Math.exp(-H0 * expFactor);")
    lines.append("    const risk = 1 - survival;")
    lines.append("    return {")
    lines.append("      year: REPORT_YEARS[i],")
    lines.append("      survival,")
    lines.append("      risk,")
    lines.append("      thresholdLow: THRESHOLD_LOW[idx],")
    lines.append("      thresholdHigh: THRESHOLD_HIGH[idx],")
    lines.append("      thresholdAverage: THRESHOLD_AVERAGE[idx],")
    lines.append("      category: getRiskCategory(risk, idx),")
    lines.append("    };")
    lines.append("  });")
    lines.append("")
    lines.append("  return { survivalCurve, contributions, yearlyRisk, linearPredictor };")
    lines.append("}")
    lines.append("")
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text("\n".join(lines) + "\n", encoding="utf-8")


def main():
    parser = argparse.ArgumentParser(description="Update coxModel.ts from a Cox .pkl bundle.")
    parser.add_argument("--bundle", default="coxnet_model_bundle.pkl", help="Path to model bundle .pkl")
    parser.add_argument("--output", default="src/lib/coxModel.ts", help="Output TypeScript file")
    args = parser.parse_args()

    with open(args.bundle, "rb") as f:
        bundle = ForgivingUnpickler(f).load()

    data = build_model_data(bundle)
    write_ts(data, Path(args.output))
    print(f"Updated {args.output} from {args.bundle}")


if __name__ == "__main__":
    main()
