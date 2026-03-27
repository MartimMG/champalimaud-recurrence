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
    "Adjuvant therapy using biological drugs",
    "Trastuzumab or other drugs",
    "Radiotherapy (RT) performed",
    "Radiotherapy on chest wall",
    "Radiotherapy on supraclavicular area",
    "Radiotherapy on internal mammary chain",
    "Endocrine therapy performed",
    "State (if hormone therapy prescribed)",
    "Treatment in association with chemotherapy",
    "Chemotherapy performed",
    "Adjuvant chemotherapy",
    "Type of invasion at CB",
    "Progesterone receptor status at CB",
    "Side location of the lesion"
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
        "N (Regional nodes affected)_23",
    ],
    "Oestrogen receptor status at CB": [
        "Oestrogen receptor status at CB_0.0",
        "Oestrogen receptor status at CB_1.0",
    ],
    "Her2 overexpression (with immunohystochemistry) at CB": [
        "Her2 overexpression (with immunohystochemistry) at CB_1.0",
        "Her2 overexpression (with immunohystochemistry) at CB_2.0",
        "Her2 overexpression (with immunohystochemistry) at CB_3.0",
    ],
    "Classification with respect to other lesions": [
        "Classification with respect to other lesions_2.0",
        "Classification with respect to other lesions_3.0",
    ],
    "Isotype at CB": [
        "Isotype at CB_1.0",
        "Isotype at CB_2.0",
        "Isotype at CB_3.0",
        "Isotype at CB_4.0",
    ],
    "Disease extent": [
        "Disease extent_1.0",
        "Disease extent_2.0",
    ],
}


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


def fmt_number(x: float) -> str:
    if np.isnan(x):
        return "0"
    text = f"{x:.10g}"
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
        # - "unknown" => all one-hot columns are 0
        # - "0" => both encoded columns are 0
        # - "1" => activate the "_1.0" column only (if present in the model)
        # - "2+" => activate the "_23" column only (if present in the model)
        out = [("Unknown", "unknown"), ("0", "0")]
        if "1.0" in sset:
            out.append(("1", "1"))
        if "23" in sset:
            # UI shows "2+" but the backend one-hot suffix is "_23".
            out.append(("2+", "23"))
        return out
    if group_name == "Oestrogen receptor status at CB":
        out = [("Unknown", "unknown")]
        if "0.0" in sset:
            out.append(("Negative", "0"))
        if "1.0" in sset:
            out.append(("Positive", "1"))
        return out
    if group_name == "Her2 overexpression (with immunohystochemistry) at CB":
        suf_map = {
            "1.0": ("Negative (0/1+)", "1"),
            "2.0": ("Dubious (2+)", "2"),
            "3.0": ("Positive (3+)", "3"),
        }
        out = [("Unknown", "unknown")]
        for suf in ("1.0", "2.0", "3.0"):
            if suf in sset:
                out.append(suf_map[suf])
        return out
    if group_name == "Classification with respect to other lesions":
        suf_map = {"2.0": ("Category 2", "2"), "3.0": ("Category 3", "3")}
        out = [("Unknown", "unknown")]
        for suf in ("2.0", "3.0"):
            if suf in sset:
                out.append(suf_map[suf])
        return out
    if group_name == "Isotype at CB":
        suf_map = {
            "1.0": ("Ductal", "1"),
            "2.0": ("Lobular", "2"),
            "3.0": ("Tubular", "3"),
            "4.0": ("Other", "4"),
        }
        out = [("Unknown", "unknown")]
        for suf in ("1.0", "2.0", "3.0", "4.0"):
            if suf in sset:
                out.append(suf_map[suf])
        return out
    if group_name == "Disease extent":
        # UI semantics:
        # - "0" => localized
        # - "1" => multifocal
        # - "2" => multicentric
        # - "unknown" => same as 0 (all one-hot columns are 0)
        out = [("Unknown", "unknown"), ("Localized", "0")]
        if "1.0" in sset:
            out.append(("Multifocal", "1"))
        if "2.0" in sset:
            out.append(("Multicentric", "2"))
        return out
    raise ValueError(f"Unknown OHE group: {group_name}")


def ohe_default_value(group_name: str) -> str:
    if group_name in (
        "Oestrogen receptor status at CB",
        "Her2 overexpression (with immunohystochemistry) at CB",
        "Classification with respect to other lesions",
        "Isotype at CB",
    ):
        return "unknown"
    if group_name == "Grade at CB":
        return "1"
    if group_name in (
        "N (Regional nodes affected)",
        "Disease extent",
    ):
        return "0"
    return "unknown"


def emit_get_raw_value_body(active_ohe_keys: set[str]) -> str:
    """TypeScript switch cases for OHE groups (by slug inputKey)."""
    blocks: dict[str, str] = {
        slugify("Grade at CB"): """      if (v === "unknown") return 0;
      if (s === "2.0") return v === "2" ? 1 : 0;
      if (s === "3.0") return v === "3" ? 1 : 0;
      return 0;""",
        slugify("Oestrogen receptor status at CB"): """      if (v === "unknown") return 0;
      if (s === "0.0") return v === "0" ? 1 : 0;
      if (s === "1.0") return v === "1" ? 1 : 0;
      return 0;""",
        slugify("Her2 overexpression (with immunohystochemistry) at CB"): """      if (v === "unknown") return 0;
      if (s === "1.0") return v === "1" ? 1 : 0;
      if (s === "2.0") return v === "2" ? 1 : 0;
      if (s === "3.0") return v === "3" ? 1 : 0;
      return 0;""",
        slugify("N (Regional nodes affected)"): """      if (v === "0") return 0;
      if (v === "unknown") return 0;
      if (s === "1.0") return v === "1" ? 1 : 0;
      if (s === "23") return v === "23" ? 1 : 0;
      return 0;""",
        slugify("Classification with respect to other lesions"): """      if (v === "unknown") return 0;
      if (s === "2.0") return v === "2" ? 1 : 0;
      if (s === "3.0") return v === "3" ? 1 : 0;
      return 0;""",
        slugify("Isotype at CB"): """      if (v === "unknown") return 0;
      if (s === "1.0") return v === "1" ? 1 : 0;
      if (s === "2.0") return v === "2" ? 1 : 0;
      if (s === "3.0") return v === "3" ? 1 : 0;
      if (s === "4.0") return v === "4" ? 1 : 0;
      return 0;""",
        slugify("Disease extent"): """      if (v === "unknown" || v === "0") return 0;
      if (s === "1.0") return v === "1" ? 1 : 0;
      if (s === "2.0") return v === "2" ? 1 : 0;
      return 0;""",
    }
    lines: list[str] = []
    for key in sorted(active_ohe_keys):
        if key not in blocks:
            continue
        lines.append(f"    case {ts_string(key)}:")
        lines.append(blocks[key])
    lines.append("    default:")
    lines.append("      return 0;")
    return "\n".join(lines)


def build_model_data(bundle: dict[str, Any]) -> dict[str, Any]:
    cox_state = bundle["cox_model"]._state
    scaler_state = bundle["scaler"]._state

    feature_names = [str(x) for x in np.asarray(cox_state["feature_names_in_"]).tolist()]
    feature_name_set = set(feature_names)
    name_to_idx = {n: i for i, n in enumerate(feature_names)}
    coefs_raw = np.asarray(cox_state["coef_"]).reshape(-1)
    data_min = np.asarray(scaler_state["data_min_"]).reshape(-1)
    data_max = np.asarray(scaler_state["data_max_"]).reshape(-1)
    scaler_scale = np.asarray(scaler_state["scale_"]).reshape(-1)
    scaler_min = np.asarray(scaler_state["min_"]).reshape(-1)

    def row_for(name: str) -> dict[str, Any]:
        i = name_to_idx[name]
        return {
            "name": name,
            "coef": float(coefs_raw[i]),
            "dataMin": float(data_min[i]),
            "dataMax": float(data_max[i]),
            "scalerScale": float(scaler_scale[i]),
            "scalerMin": float(scaler_min[i]),
        }

    nonzero = {feature_names[i] for i in range(len(feature_names)) if abs(float(coefs_raw[i])) > 1e-12}

    features: list[dict[str, Any]] = []
    binary_switch: list[dict[str, str]] = []
    continuous_inputs: list[dict[str, Any]] = []
    numeric_select: list[dict[str, Any]] = []
    ohe_ui: list[dict[str, Any]] = []
    active_ohe_keys: set[str] = set()
    defaults: dict[str, Any] = {}

    for b in BINARY_VARIABLES:
        if b not in nonzero:
            continue
        r = row_for(b)
        r["inputKey"] = slugify(b)
        features.append(r)
        binary_switch.append({"key": r["inputKey"], "label": b})
        defaults[r["inputKey"]] = 0

    for c in CONTINUOUS_VARIABLES:
        if c not in nonzero:
            continue
        r = row_for(c)
        r["inputKey"] = slugify(c)
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
    t_idx = np.searchsorted(threshold_times, times, side="right") - 1
    t_idx = np.clip(t_idx, 0, len(threshold_times) - 1)
    threshold_low = threshold_low_vals[t_idx].tolist()
    threshold_high = threshold_high_vals[t_idx].tolist()

    return {
        "features": features,
        "offset": float(np.asarray(cox_state["offset_"]).reshape(-1)[0]),
        "baseline_times": baseline_times,
        "baseline_cum_hazards": baseline_cum_hazards,
        "threshold_low": threshold_low,
        "threshold_high": threshold_high,
        "binary_switch": binary_switch,
        "continuous_inputs": continuous_inputs,
        "numeric_select": numeric_select,
        "ohe_ui": ohe_ui,
        "active_ohe_keys": active_ohe_keys,
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
    lines.append("")
    lines.append("export const BINARY_SWITCH_VARIABLES = [")
    for v in data["binary_switch"]:
        lines.append(f"  {{ key: {ts_string(v['key'])}, label: {ts_string(v['label'])} }},")
    lines.append("] as const;")
    lines.append("")
    lines.append("export const BINARY_DROPDOWN_VARIABLES = [] as const;")
    lines.append("")
    lines.append("export const CONTINUOUS_INPUT_VARIABLES = [")
    for v in data["continuous_inputs"]:
        lines.append(
            f"  {{ key: {ts_string(v['key'])}, label: {ts_string(v['label'])}, min: {fmt_number(v['min'])}, max: {fmt_number(v['max'])} }},"
        )
    lines.append("] as const;")
    lines.append("")
    lines.append("export const OHE_UI_VARIABLES = [")
    for cat in data["ohe_ui"]:
        lines.append(f"  {{ key: {ts_string(cat['key'])}, label: {ts_string(cat['label'])}, options: [")
        for opt in cat["options"]:
            lines.append(f"    {{ label: {ts_string(opt['label'])}, value: {ts_string(opt['value'])} }},")
        lines.append("  ] },")
    lines.append("] as const;")
    lines.append("")
    lines.append("export const NUMERIC_SELECT_VARIABLES = [")
    for field in data["numeric_select"]:
        lines.append(f"  {{ key: {ts_string(field['key'])}, label: {ts_string(field['label'])}, options: [")
        for opt in field["options"]:
            lines.append(f"    {{ label: {ts_string(opt['label'])}, value: {opt['value']} }},")
        lines.append("  ] },")
    lines.append("] as const;")
    lines.append("")
    lines.append("export const GRADE_OPTIONS = [] as const;")
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
    lines.append('export type RiskCategory = "low" | "intermediate" | "high";')
    lines.append("")
    lines.append("export function getRiskCategory(risk: number, timeIndex: number): RiskCategory {")
    lines.append('  if (timeIndex < 0 || timeIndex >= THRESHOLD_LOW.length) return "intermediate";')
    lines.append('  if (risk <= THRESHOLD_LOW[timeIndex]) return "low";')
    lines.append('  if (risk >= THRESHOLD_HIGH[timeIndex]) return "high";')
    lines.append('  return "intermediate";')
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
    lines.append(emit_get_raw_value_body(data["active_ohe_keys"]))
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
    lines.append("    const contribution = spec.coef * scaled;")
    lines.append("    linearPredictor += contribution;")
    lines.append("")
    lines.append("    const displayName = spec.groupName || spec.name;")
    lines.append("    const existing = contributions.find((c) => c.name === displayName);")
    lines.append("    if (existing) {")
    lines.append("      existing.contribution += contribution;")
    lines.append("      existing.scaledValue = Math.max(existing.scaledValue, scaled);")
    lines.append("    } else {")
    lines.append("      contributions.push({ name: displayName, coefficient: spec.coef, scaledValue: scaled, contribution });")
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
