import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BINARY_SWITCH_VARIABLES,
  BINARY_DROPDOWN_VARIABLES,
  CONTINUOUS_INPUT_VARIABLES,
  OHE_UI_VARIABLES,
  NUMERIC_SELECT_VARIABLES,
  type PatientInput,
} from "@/lib/coxModel";

interface PatientFormProps {
  input: PatientInput;
  onChange: (input: PatientInput) => void;
}

const PatientForm = ({ input, onChange }: PatientFormProps) => {
  const updateField = (key: keyof PatientInput, value: number | string) => {
    onChange({ ...input, [key]: value });
  };

  return (
    <Card className="border-border/60 shadow-md">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold tracking-tight">
          Patient Variables
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Toggle or select the clinical variables for risk assessment
        </p>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Binary switch variables */}
        <div className="space-y-3">
          {BINARY_SWITCH_VARIABLES.map((v) => (
            <div
              key={v.key}
              className="flex items-center justify-between gap-3 rounded-lg border border-border/40 bg-muted/30 px-3 py-2.5"
            >
              <Label
                htmlFor={v.key}
                className="text-sm font-normal leading-tight cursor-pointer flex-1"
              >
                {v.label}
              </Label>
              <Switch
                id={v.key}
                checked={input[v.key] === 1}
                onCheckedChange={(checked) =>
                  updateField(v.key, checked ? 1 : 0)
                }
              />
            </div>
          ))}
        </div>

        {/* Binary dropdown variables */}
        {BINARY_DROPDOWN_VARIABLES.map((v) => (
          <div key={v.key} className="space-y-2">
            <Label className="text-sm font-medium">{v.label}</Label>
            <Select
              value={String(input[v.key as keyof PatientInput])}
              onValueChange={(val) => updateField(v.key as keyof PatientInput, Number(val))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {v.options.map((opt) => (
                  <SelectItem key={opt.value} value={String(opt.value)}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ))}

        {/* Discrete dropdowns (e.g. Grade at CB) */}
        {NUMERIC_SELECT_VARIABLES.map((field) => (
          <div key={field.key} className="space-y-2">
            <Label className="text-sm font-medium">{field.label}</Label>
            <Select
              value={String(input[field.key as keyof PatientInput])}
              onValueChange={(v) => updateField(field.key as keyof PatientInput, Number(v))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {field.options.map((opt) => (
                  <SelectItem key={opt.value} value={String(opt.value)}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ))}

        {/* Continuous inputs (from scaler range in model bundle) */}
        {CONTINUOUS_INPUT_VARIABLES.map((field) => (
          <div key={field.key} className="space-y-2">
            <Label className="text-sm font-medium" htmlFor={field.key}>
              {field.label}
            </Label>
            <Input
              id={field.key}
              type="number"
              min={field.min}
              max={field.max}
              step="any"
              value={input[field.key as keyof PatientInput] as number}
              onChange={(e) => {
                const n = parseFloat(e.target.value);
                updateField(
                  field.key as keyof PatientInput,
                  Number.isFinite(n) ? n : field.min
                );
              }}
            />
          </div>
        ))}

        {/* One-hot encoded groups (split into columns in the model) */}
        {OHE_UI_VARIABLES.map((cat) => (
          <div key={cat.key} className="space-y-2">
            <Label className="text-sm font-medium">{cat.label}</Label>
            <Select
              value={input[cat.key] as string}
              onValueChange={(v) => updateField(cat.key as keyof PatientInput, v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {cat.options.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default PatientForm;
