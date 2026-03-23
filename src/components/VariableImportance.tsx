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
import type { FeatureContribution } from "@/lib/coxModel";

interface VariableImportanceProps {
  contributions: FeatureContribution[];
}

const VariableImportance = ({ contributions }: VariableImportanceProps) => {
  const chartData = contributions.map((c) => ({
    name: c.name.length > 30 ? c.name.slice(0, 28) + "…" : c.name,
    fullName: c.name,
    contribution: +c.contribution.toFixed(4),
    direction: c.contribution >= 0 ? "risk" : "protective",
  }));

  return (
    <Card className="border-border/60 shadow-md">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold tracking-tight">
          Variable Contributions
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          How each variable affects the patient's risk score.{" "}
          <span className="text-destructive font-medium">Red</span> increases risk,{" "}
          <span className="text-accent-foreground font-medium" style={{ color: "hsl(var(--accent))" }}>teal</span> is protective.
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
                label={{ value: "Contribution to risk", position: "insideBottomRight", offset: -5, style: { fill: "hsl(var(--muted-foreground))", fontSize: 12 } }}
              />
              <YAxis
                type="category"
                dataKey="name"
                width={180}
                tick={{ fill: "hsl(var(--foreground))", fontSize: 11 }}
                stroke="hsl(var(--border))"
              />
              <Tooltip
                contentStyle={{
                  background: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  fontSize: 13,
                }}
                formatter={(value: number, _: string, props: { payload: { fullName: string; direction: string } }) => [
                  `${value > 0 ? "+" : ""}${value.toFixed(4)}`,
                  props.payload.fullName,
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
