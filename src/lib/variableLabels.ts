import { BINARY_SWITCH_VARIABLES, OHE_UI_VARIABLES, type PatientInput } from "@/lib/coxModel";

// Shared by PatientForm and VariableImportance. It has to be one function, not a copy in
// each: getValueLabelForGroup below reverse-maps a display name back to a variable by
// matching on the formatted label, so any drift between the two would silently turn the
// contribution chart's value chips into "N/A".
export function formatUiVariableLabel(label: string): string {
  if (label === "Radiotherapy (RT) performed") return "Radiotherapy";
  if (label === "Treatment in association with chemotherapy") {
    return "Hormone therapy associated with chemotherapy protocol";
  }
  if (label === "N (Regional nodes affected)") return "Number of regional nodes affected";
  if (label === "Oestrogen receptor status at CB") return "Estrogen receptor status";
  if (label === "Her2 overexpression (with immunohystochemistry) at CB") return "HER2 overexpression (with immunohystochemistry)";
  return label.replace(/ at CB$/, "");
}

// Binary variables whose on/off reads as something other than Yes/No.
const BINARY_VALUE_LABELS: Record<string, { off: string; on: string }> = {
  side_location_of_the_lesion: { off: "Left", on: "Right" },
  oestrogen_receptor_status_at_cb: { off: "Negative", on: "Positive" },
};

export function getValueLabelForGroup(displayName: string, input: PatientInput): string {
  const binary = BINARY_SWITCH_VARIABLES.find((v) => formatUiVariableLabel(v.label) === displayName);
  if (binary) {
    const on = input[binary.key as keyof PatientInput] === 1;
    const labels = BINARY_VALUE_LABELS[binary.key];
    if (labels) return on ? labels.on : labels.off;
    return on ? "Yes" : "No";
  }

  const ohe = OHE_UI_VARIABLES.find((v) => formatUiVariableLabel(v.label) === displayName);
  if (ohe) {
    const selected = String(input[ohe.key as keyof PatientInput]);
    const match = ohe.options.find((opt) => opt.value === selected);
    return match?.label ?? selected;
  }

  return "N/A";
}
