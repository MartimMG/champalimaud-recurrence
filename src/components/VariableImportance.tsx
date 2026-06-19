import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import {
  BINARY_SWITCH_VARIABLES,
  OHE_UI_VARIABLES,
  type FeatureContribution,
  type PatientInput,
} from "@/lib/coxModel";

interface VariableImportanceProps {
  contributions: FeatureContribution[];
  input: PatientInput;
}

function formatUiVariableLabel(label: string): string {
  if (label === "Radiotherapy (RT) performed") return "Radiotherapy";
  if (label === "Endocrine therapy performed") return "Biological therapy";
  if (label === "Treatment in association with chemotherapy") {
    return "Hormone therapy associated with chemotherapy protocol";
  }
  return label;
}

function getValueLabelForGroup(displayName: string, input: PatientInput): string {
  const binary = BINARY_SWITCH_VARIABLES.find((v) => formatUiVariableLabel(v.label) === displayName);
  if (binary) {
    if (binary.key === "side_location_of_the_lesion") return input[binary.key] === 1 ? "Right" : "Left";
    return input[binary.key] === 1 ? "Yes" : "No";
  }

  const ohe = OHE_UI_VARIABLES.find((v) => v.label === displayName);
  if (ohe) {
    const selected = String(input[ohe.key]);
    const match = ohe.options.find((opt) => opt.value === selected);
    return match?.label ?? selected;
  }

  return "N/A";
}

function wrapTickLabel(name: string, maxLengthPerLine = 28): string[] {
  if (name.length <= maxLengthPerLine) return [name];

  const words = name.split(" ");
  if (words.length === 1) return [name];

  let firstLine = "";
  let secondLine = "";

  for (const word of words) {
    const candidate = firstLine ? `${firstLine} ${word}` : word;
    if (candidate.length <= maxLengthPerLine) {
      firstLine = candidate;
    } else {
      secondLine = secondLine ? `${secondLine} ${word}` : word;
    }
  }

  if (!secondLine) return [name];

  return [firstLine, secondLine];
}

const VariableImportance = ({ contributions, input }: VariableImportanceProps) => {
  const chartData = contributions.map((c) => ({
    fullName: formatUiVariableLabel(c.name),
    valueLabel: getValueLabelForGroup(formatUiVariableLabel(c.name), input),
    contribution: +c.contribution.toFixed(4),
    direction: c.contribution >= 0 ? ("risk" as const) : ("protective" as const),
  }));

  const valueByName = new Map(chartData.map((d) => [d.fullName, d.valueLabel]));

  return (
    <Card className="border-border/60 shadow-md">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold tracking-tight">
          Variable Contributions
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          How each variable affects the patient&apos;s risk score.{" "}
          <span className="text-destructive font-medium">Red</span> increases risk,{" "}
          <span className="text-accent-foreground font-medium" style={{ color: "hsl(var(--accent))" }}>
            green
          </span>{" "}
          is protective.
        </p>
      </CardHeader>
      <CardContent>
        <div className="h-[380px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
              <XAxis
                type="number"
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                stroke="hsl(var(--border))"
                label={{
                  value: "Contribution to risk",
                  position: "insideBottomRight",
                  offset: -5,
                  style: { fill: "hsl(var(--muted-foreground))", fontSize: 12 },
                }}
              />
              <YAxis
                type="category"
                dataKey="fullName"
                width={300}
                interval={0}
                stroke="hsl(var(--border))"
                tick={({ x, y, payload }) => {
                  const name = String(payload?.value ?? "");
                  const value = valueByName.get(name) ?? "N/A";
                  const lines = wrapTickLabel(name);
                  const lineHeight = 12;
                  const nameX = x - 120;
                  const valueX = x - 114;
                  return (
                    <g>
                      <text
                        x={nameX}
                        y={y}
                        fill="hsl(var(--foreground))"
                        fontSize={10}
                        textAnchor="end"
                        dominantBaseline="central"
                      >
                        {lines.map((line, index) => (
                          <tspan key={`${line}-${index}`} x={nameX} dy={index === 0 ? -(lines.length - 1) * lineHeight / 2 : lineHeight}>
                            {line}
                          </tspan>
                        ))}
                      </text>
                      <text
                        x={valueX}
                        y={y}
                        fill="hsl(var(--foreground))"
                        fontSize={10}
                        fontWeight={700}
                        textAnchor="start"
                        dominantBaseline="central"
                      >
                        [{value}]
                      </text>
                    </g>
                  );
                }}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  background: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  fontSize: 13,
                }}
                labelFormatter={(label) => String(label)}
                formatter={(value: number, _: string, props: { payload: { fullName: string; valueLabel: string } }) => [
                  `${value > 0 ? "+" : ""}${Number(value).toFixed(4)} (Value: ${props.payload.valueLabel})`,
                  "Contribution",
                ]}
              />
              <Bar dataKey="contribution" radius={[0, 4, 4, 0]} barSize={22}>
                {chartData.map((entry, index) => (
                  <Cell
                    key={index}
                    fill={
                      entry.direction === "risk"
                          ? "hsl(var(--destructive))"
                          : "hsl(var(--accent))"
                    }
                    fillOpacity={0.85}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default VariableImportance;
