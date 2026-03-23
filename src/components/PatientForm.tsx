import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BINARY_SWITCH_VARIABLES,
  BINARY_DROPDOWN_VARIABLES,
  CATEGORICAL_VARIABLES,
  GRADE_OPTIONS,
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

        {/* Binary dropdown variables (Side location, Source of referral, Progesterone) */}
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

        {/* Grade */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Grade at CB</Label>
          <Select
            value={String(input.grade)}
            onValueChange={(v) => updateField("grade", Number(v))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {GRADE_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={String(opt.value)}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Categorical variables */}
        {CATEGORICAL_VARIABLES.map((cat) => (
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
