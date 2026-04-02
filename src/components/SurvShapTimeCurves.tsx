import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { SurvShapTimeSeries } from "@/lib/survshapApi";

const PALETTE = [
  "hsl(var(--primary))",
  "hsl(var(--destructive))",
  "hsl(var(--accent))",
  "#f59e0b",
  "#8b5cf6",
  "#06b6d4",
  "#ec4899",
  "#84cc16",
];

interface SurvShapTimeCurvesProps {
  timeSeries: SurvShapTimeSeries | null;
  loading?: boolean;
  topN?: number;
}

function formatUiVariableLabel(label: string): string {
  if (label === "Radiotherapy (RT) performed") return "Radiotherapy performed";
  return label;
}

const SurvShapTimeCurves = ({ timeSeries, loading = false, topN = 8 }: SurvShapTimeCurvesProps) => {
  const chartData = useMemo(() => {
    if (!timeSeries?.times?.length || !timeSeries.series?.length) return [];
    const ranked = [...timeSeries.series].sort((a, b) => {
      const sa = a.values.reduce((s, v) => s + Math.abs(v), 0);
      const sb = b.values.reduce((s, v) => s + Math.abs(v), 0);
      return sb - sa;
    });
    const pick = ranked.slice(0, topN);
    return timeSeries.times.map((t, i) => {
      const row: Record<string, number | string> = { timeDays: t, timeYears: +(t / 365).toFixed(2) };
      for (const s of pick) {
        const key = s.displayName;
        row[key] = s.values[i] ?? 0;
      }
      return row;
    });
  }, [timeSeries, topN]);

  const lineKeys = useMemo(() => {
    if (!timeSeries?.series?.length) return [];
    const ranked = [...timeSeries.series].sort((a, b) => {
      const sa = a.values.reduce((s, v) => s + Math.abs(v), 0);
      const sb = b.values.reduce((s, v) => s + Math.abs(v), 0);
      return sb - sa;
    });
    return ranked.slice(0, topN).map((s) => s.displayName);
  }, [timeSeries, topN]);

  if (loading) {
    return (
      <Card className="border-border/60 shadow-md">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold tracking-tight">SurvSHAP(t) over time</CardTitle>
          <p className="text-sm text-muted-foreground">Computing time-dependent explanations…</p>
        </CardHeader>
      </Card>
    );
  }

  if (!chartData.length || !lineKeys.length) {
    return (
      <Card className="border-border/60 shadow-md">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold tracking-tight">SurvSHAP(t) over time</CardTitle>
          <p className="text-sm text-muted-foreground">No time-dependent data available.</p>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="border-border/60 shadow-md">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold tracking-tight">SurvSHAP(t) over time</CardTitle>
        <p className="text-sm text-muted-foreground">
          Signed SurvSHAP contributions by variable across follow-up (days). Showing top {lineKeys.length}{" "}
          variables by total magnitude.
        </p>
      </CardHeader>
      <CardContent>
        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="timeDays"
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
                stroke="hsl(var(--border))"
                label={{ value: "Time (days)", position: "insideBottom", offset: -2, style: { fill: "hsl(var(--muted-foreground))", fontSize: 11 } }}
              />
              <YAxis
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
                stroke="hsl(var(--border))"
                label={{ value: "SHAP (survival)", angle: -90, position: "insideLeft", offset: 10, style: { fill: "hsl(var(--muted-foreground))", fontSize: 11 } }}
              />
              <Tooltip
                contentStyle={{
                  background: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  fontSize: 12,
                }}
                formatter={(value: number) => [value.toFixed(4), ""]}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              {lineKeys.map((key, idx) => (
                <Line
                  key={key}
                  type="monotone"
                  dataKey={key}
                  name={formatUiVariableLabel(key)}
                  stroke={PALETTE[idx % PALETTE.length]}
                  dot={false}
                  strokeWidth={1.5}
                />
              ))}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default SurvShapTimeCurves;
