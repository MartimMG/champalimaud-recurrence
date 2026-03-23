import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";

interface RiskCurveProps {
  survivalCurve: { time: number; survival: number; risk: number }[];
  yearlyRisk: { year: number; survival: number; risk: number }[];
}

const RiskCurve = ({ survivalCurve, yearlyRisk }: RiskCurveProps) => {
  // Convert days to years for display, sample every 30 days
  const chartData = survivalCurve
    .filter((_, i) => i % 6 === 0 || i === survivalCurve.length - 1)
    .map((d) => ({
      years: +(d.time / 365).toFixed(2),
      risk: +(d.risk * 100).toFixed(2),
      survival: +(d.survival * 100).toFixed(2),
    }));

  return (
    <div className="space-y-4">
      <Card className="border-border/60 shadow-md">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold tracking-tight">
            Cumulative Risk Over Time
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Predicted probability of breast cancer recurrence
          </p>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="riskGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--destructive))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--destructive))" stopOpacity={0.02} />
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
                  formatter={(value: number) => [`${value.toFixed(2)}%`, "Risk"]}
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
                <Area
                  type="monotone"
                  dataKey="risk"
                  stroke="hsl(var(--destructive))"
                  strokeWidth={2.5}
                  fill="url(#riskGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Yearly risk summary */}
      <Card className="border-border/60 shadow-md">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold tracking-tight">
            Risk at Key Timepoints
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-5 gap-2">
            {yearlyRisk.map((yr) => (
              <div
                key={yr.year}
                className="text-center rounded-lg border border-border/40 bg-muted/30 p-3"
              >
                <div className="text-xs text-muted-foreground font-medium">
                  Year {yr.year}
                </div>
                <div className="text-xl font-bold text-destructive mt-1">
                  {(yr.risk * 100).toFixed(1)}%
                </div>
                <div className="text-[10px] text-muted-foreground mt-0.5">
                  risk
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RiskCurve;
