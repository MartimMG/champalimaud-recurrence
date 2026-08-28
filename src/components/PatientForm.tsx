import { useEffect, useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BINARY_SWITCH_VARIABLES,
  CONTINUOUS_INPUT_VARIABLES,
  OHE_UI_VARIABLES,
  type PatientInput,
} from "@/lib/coxModel";
import { formatUiVariableLabel } from "@/lib/variableLabels";

type VariableGroup = "clinical" | "treatment";

const SECTION_LOCATION_NODES = "Locoregional status";

// Hand-maintained: a field generated into coxModel.ts but missing here renders nowhere.
const VARIABLE_META: Record<string, { group: VariableGroup; section: string }> = {
  // Clinical
  side_location_of_the_lesion: { group: "clinical", section: SECTION_LOCATION_NODES },
  grade_at_cb: { group: "clinical", section: "Core biopsy findings" },
  oestrogen_receptor_status_at_cb: { group: "clinical", section: "Core biopsy findings" },
  isotype_at_cb: { group: "clinical", section: "Core biopsy findings" },
  // Treatment
  radiotherapy_rt_performed: { group: "treatment", section: "Radiotherapy" },
  radiotherapy_on_supraclavicular_area: { group: "treatment", section: "Radiotherapy" },
  biological_therapy: { group: "treatment", section: "Systemic therapy" },
  treatment_in_association_with_chemotherapy: { group: "treatment", section: "Systemic therapy" },
};

const SECTION_ORDER: Record<VariableGroup, string[]> = {
  clinical: [SECTION_LOCATION_NODES, "Core biopsy findings"],
  treatment: ["Radiotherapy", "Systemic therapy"],
};

const GROUP_COPY: Record<VariableGroup, { title: string }> = {
  clinical: { title: "Clinical Variables" },
  treatment: { title: "Treatment Variables" },
};

interface PatientFormProps {
  input: PatientInput;
  onChange: (input: PatientInput) => void;
  group: VariableGroup;
}

type FieldItem =
  | { kind: "switch"; key: string; label: string }
  | { kind: "continuous"; key: string; label: string; min: number; max: number }
  | { kind: "ohe"; key: string; label: string; options: readonly { label: string; value: string }[] };

interface ContinuousFieldProps {
  field: Extract<FieldItem, { kind: "continuous" }>;
  value: number;
  onChange: (value: number) => void;
}

// Uses its own local text state so the field can be freely cleared while typing
// (a controlled input bound straight to the numeric model snaps back to the
// fallback value the instant it's empty, making the default "0" impossible to
// remove). Clamping to [min, max] and syncing back to the model only happens
// on blur/Enter, once the user is done typing.
function ContinuousField({ field, value, onChange }: ContinuousFieldProps) {
  const [text, setText] = useState(String(value));

  useEffect(() => {
    setText(String(value));
  }, [value]);

  const commit = (raw: string) => {
    const parsed = parseFloat(raw);
    const clamped = Number.isFinite(parsed)
      ? Math.min(field.max, Math.max(field.min, parsed))
      : field.min;
    onChange(clamped);
    setText(String(clamped));
  };

  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium" htmlFor={field.key}>
        {field.label}
      </Label>
      <Input
        id={field.key}
        type="number"
        min={field.min}
        max={field.max}
        step="any"
        value={text}
        onFocus={(e) => {
          if (e.currentTarget.value === "0") {
            setText("");
          } else {
            e.currentTarget.select();
          }
        }}
        onChange={(e) => setText(e.target.value)}
        onBlur={(e) => commit(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit(e.currentTarget.value);
        }}
      />
    </div>
  );
}

const ALL_FIELDS: FieldItem[] = [
  ...BINARY_SWITCH_VARIABLES.map((v): FieldItem => ({ kind: "switch", key: v.key, label: v.label })),
  ...CONTINUOUS_INPUT_VARIABLES.map((v): FieldItem => ({ kind: "continuous", key: v.key, label: v.label, min: v.min, max: v.max })),
  ...OHE_UI_VARIABLES.map((v): FieldItem => ({ kind: "ohe", key: v.key, label: v.label, options: v.options })),
];

const PatientForm = ({ input, onChange, group }: PatientFormProps) => {
  const updateField = (key: keyof PatientInput, value: number | string) => {
    onChange({ ...input, [key]: value });
  };

  const binarySwitchIndicators: Record<string, { off: string; on: string } | undefined> = {
    oestrogen_receptor_status_at_cb: { off: "-", on: "+" },
    side_location_of_the_lesion: { off: "L", on: "R" },
  };

  const sections = SECTION_ORDER[group].map((sectionName) => ({
    name: sectionName,
    fields: ALL_FIELDS.filter(
      (f) => VARIABLE_META[f.key]?.group === group && VARIABLE_META[f.key]?.section === sectionName
    ),
  }));

  const { title } = GROUP_COPY[group];

  const renderField = (field: FieldItem) => {
    switch (field.kind) {
      case "switch": {
        const key = field.key as keyof PatientInput;
        const indicators = binarySwitchIndicators[field.key];
        return (
          <div
            key={field.key}
            className="flex items-center justify-between gap-3 rounded-lg border border-border/40 bg-muted/30 px-3 py-1.5"
          >
            <Label
              htmlFor={field.key}
              className="text-sm font-normal leading-tight cursor-pointer flex-1"
            >
              {formatUiVariableLabel(field.label)}
            </Label>
            {indicators?.off && (
              <span className="text-xs text-muted-foreground tabular-nums min-w-3 text-right">
                {indicators.off}
              </span>
            )}
            <Switch
              id={field.key}
              checked={input[key] === 1}
              onCheckedChange={(checked) => updateField(key, checked ? 1 : 0)}
              className={
                field.key === "side_location_of_the_lesion" ||
                field.key === "oestrogen_receptor_status_at_cb"
                  ? "data-[state=checked]:bg-input"
                  : undefined
              }
            />
            {indicators?.on && (
              <span className="text-xs text-muted-foreground tabular-nums min-w-3">
                {indicators.on}
              </span>
            )}
          </div>
        );
      }
      case "continuous":
        return (
          <ContinuousField
            key={field.key}
            field={field}
            value={input[field.key as keyof PatientInput] as number}
            onChange={(v) => updateField(field.key as keyof PatientInput, v)}
          />
        );
      case "ohe":
        return (
          <div key={field.key} className="space-y-1.5">
            <Label className="text-sm font-medium">{formatUiVariableLabel(field.label)}</Label>
            <Select
              value={input[field.key as keyof PatientInput] as string}
              onValueChange={(v) => updateField(field.key as keyof PatientInput, v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {field.options.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );
    }
  };

  return (
    <Card className="flex flex-col border-border/60 shadow-md lg:max-h-[calc(100vh-96px)]">
      <CardHeader className="shrink-0 px-4 pt-4 pb-2">
        <CardTitle className="text-base font-semibold tracking-tight">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 pb-4">
        {sections.map((section, index) => (
          <div key={section.name} className={index > 0 ? "border-t border-border/40 pt-2.5" : undefined}>
            <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground/70">
              {section.name}
            </h3>
            <div className="space-y-1.5">
              {section.fields.map((field) => renderField(field))}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default PatientForm;
