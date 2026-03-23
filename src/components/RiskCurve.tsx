import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Line,
  ComposedChart,
} from "recharts";
import type { RiskCategory } from "@/lib/coxModel";

interface SurvivalPoint {
  time: number;
  survival: number;
  risk: number;
  thresholdLow: number;
  thresholdHigh: number;
  category: RiskCategory;
}

interface YearlyRisk {
  year: number;
  survival: number;
  risk: number;
  thresholdLow: number;
  thresholdHigh: number;
  category: RiskCategory;
}

interface RiskCurveProps {
  survivalCurve: SurvivalPoint[];
  yearlyRisk: YearlyRisk[];
}

const categoryConfig: Record<RiskCategory, { label: string; className: string }> = {
  low: { label: "Low", className: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  intermediate: { label: "Intermediate", className: "bg-amber-100 text-amber-800 border-amber-200" },
  high: { label: "High", className: "bg-red-100 text-red-800 border-red-200" },
};

const RiskCurve = ({ survivalCurve, yearlyRisk }: RiskCurveProps) => {
  const chartData = survivalCurve
    .filter((_, i) => i % 6 === 0 || i === survivalCurve.length - 1)
    .map((d) => ({
      years: +(d.time / 365).toFixed(2),
      risk: +(d.risk * 100).toFixed(3),
      thresholdLow: +(d.thresholdLow * 100).toFixed(3),
      thresholdHigh: +(d.thresholdHigh * 100).toFixed(3),
    }));

  return (
    <div className="space-y-4">
      <Card className="border-border/60 shadow-md">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold tracking-tight">
            Cumulative Risk Over Time
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Patient risk vs. dynamic thresholds —{" "}
            <span className="text-emerald-600">green</span> = low,{" "}
            <span className="text-amber-600">amber zone</span> = intermediate,{" "}
            <span className="text-red-600">red</span> = high risk
          </p>
        </CardHeader>
        <CardContent>
          <div className="h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="riskGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="thresholdFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.08} />
                    <stop offset="100%" stopColor="#f59e0b" stopOpacity={0.03} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="years"
                  label={{ value: "Years", position: "insideBottomRight", offset: -5, style: { fill: "hsl(var(--muted-foreground))", fontSize: 12 } }}
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                  stroke="hsl(var(--border))"
                />
                <YAxis
                  label={{ value: "Risk (%)", angle: -90, position: "insideLeft", offset: 10, style: { fill: "hsl(var(--muted-foreground))", fontSize: 12 } }}
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                  stroke="hsl(var(--border))"
                  domain={[0, "auto"]}
                />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    fontSize: 13,
                  }}
                  formatter={(value: number, name: string) => {
                    const labels: Record<string, string> = {
                      risk: "Patient Risk",
                      thresholdLow: "Low → Intermediate",
                      thresholdHigh: "Intermediate → High",
                    };
                    return [`${value.toFixed(3)}%`, labels[name] || name];
                  }}
                  labelFormatter={(label) => `${label} years`}
                />
                {[1, 2, 3, 4, 5].map((yr) => (
                  <ReferenceLine
                    key={yr}
                    x={yr}
                    stroke="hsl(var(--muted-foreground))"
                    strokeDasharray="2 4"
                    strokeOpacity={0.4}
                  />
                ))}
                {/* Threshold band */}
                <Area
                  type="monotone"
                  dataKey="thresholdHigh"
                  stroke="none"
                  fill="url(#thresholdFill)"
                  fillOpacity={1}
                />
                {/* Threshold lines */}
                <Line
                  type="monotone"
                  dataKey="thresholdLow"
                  stroke="#10b981"
                  strokeWidth={1.5}
                  strokeDasharray="6 3"
                  dot={false}
                  name="thresholdLow"
                />
                <Line
                  type="monotone"
                  dataKey="thresholdHigh"
                  stroke="#ef4444"
                  strokeWidth={1.5}
                  strokeDasharray="6 3"
                  dot={false}
                  name="thresholdHigh"
                />
                {/* Patient risk curve */}
                <Area
                  type="monotone"
                  dataKey="risk"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2.5}
                  fill="url(#riskGradient)"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Yearly risk summary with categories */}
      <Card className="border-border/60 shadow-md">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold tracking-tight">
            Risk at Key Timepoints
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-5 gap-2">
            {yearlyRisk.map((yr) => {
              const cat = categoryConfig[yr.category];
              return (
                <div
                  key={yr.year}
                  className="text-center rounded-lg border border-border/40 bg-muted/30 p-3"
                >
                  <div className="text-xs text-muted-foreground font-medium">
                    Year {yr.year}
                  </div>
                  <div className="text-xl font-bold text-foreground mt-1">
                    {(yr.risk * 100).toFixed(2)}%
                  </div>
                  <Badge variant="outline" className={`mt-1.5 text-[10px] px-1.5 py-0 ${cat.className}`}>
                    {cat.label}
                  </Badge>
                  <div className="text-[9px] text-muted-foreground mt-1 space-y-0">
                    <div>Low ≤ {(yr.thresholdLow * 100).toFixed(2)}%</div>
                    <div>High ≥ {(yr.thresholdHigh * 100).toFixed(2)}%</div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RiskCurve;
