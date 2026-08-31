import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// "Risk at Key Timepoints" section disabled — see matching comment blocks below to re-enable.
// import { Badge } from "@/components/ui/badge";
import {
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
  thresholdAverage: number;
  category: RiskCategory;
}

interface YearlyRisk {
  year: number;
  survival: number;
  risk: number;
  thresholdLow: number;
  thresholdHigh: number;
  thresholdAverage: number;
  category: RiskCategory;
}

interface RiskCurveProps {
  survivalCurve: SurvivalPoint[];
  yearlyRisk: YearlyRisk[];
}

// Used only by the disabled "Risk at Key Timepoints" card below.
// const categoryConfig: Record<RiskCategory, { label: string; className: string }> = {
//   low: { label: "Low", className: "bg-emerald-100 text-emerald-800 border-emerald-200" },
//   intermediate: { label: "Below average", className: "bg-yellow-100 text-yellow-800 border-yellow-200" },
//   average: { label: "Above average", className: "bg-orange-100 text-orange-800 border-orange-200" },
//   high: { label: "High", className: "bg-red-100 text-red-800 border-red-200" },
// };

/** Human-readable follow-up from days since baseline (e.g. "3 years and 2 months"). */
function formatYearsAndMonthsFromDays(days: number): string {
  const d = Math.max(0, Math.round(days));
  const y = Math.floor(d / 365);
  const rem = d - y * 365;
  const avgMonth = 365 / 12;
  const m = Math.floor(rem / avgMonth);
  const parts: string[] = [];
  if (y > 0) parts.push(`${y} year${y === 1 ? "" : "s"}`);
  if (m > 0) parts.push(`${m} month${m === 1 ? "" : "s"}`);
  if (parts.length === 0) {
    if (d === 0) return "0 days";
    return `${d} day${d === 1 ? "" : "s"}`;
  }
  return parts.join(" and ");
}

/** Tooltip: Patient risk (blue), High (red), Low (green) — Recharts positions the wrapper. */
function RiskChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: ReadonlyArray<{ value?: unknown; dataKey?: unknown }>;
  label?: string | number;
}) {
  if (!active || !payload?.length) return null;
  const map: Record<string, number> = {};
  for (const p of payload) {
    const k = p.dataKey != null ? String(p.dataKey) : "";
    if (k) map[k] = Number(p.value);
  }
  const rows = [
    {
      key: "risk",
      text: "Patient risk",
      dotClass: "bg-blue-500",
      valueClass: "text-blue-600 dark:text-blue-400",
    },
    {
      key: "thresholdAverage",
      text: "Average",
      dotClass: "bg-amber-500",
      valueClass: "text-amber-600 dark:text-amber-400",
    },
    {
      key: "thresholdHigh",
      text: "High",
      dotClass: "bg-red-500",
      valueClass: "text-red-600 dark:text-red-400",
    },
    {
      key: "thresholdLow",
      text: "Low",
      dotClass: "bg-emerald-500",
      valueClass: "text-emerald-600 dark:text-emerald-400",
    },
  ] as const;
  const sortedRows = [...rows].sort((a, b) => {
    const va = map[a.key];
    const vb = map[b.key];
    const aMissing = va == null || Number.isNaN(va);
    const bMissing = vb == null || Number.isNaN(vb);
    if (aMissing && bMissing) return 0;
    if (aMissing) return 1;
    if (bMissing) return -1;
    return vb - va;
  });
  return (
    <div className="rounded-lg border border-border/80 bg-card/95 px-3 py-2.5 text-sm shadow-lg ring-1 ring-black/5 backdrop-blur-sm dark:ring-white/10">
      <p className="text-muted-foreground mb-2 text-xs font-medium">
        {label != null && label !== "" ? formatYearsAndMonthsFromDays(Number(label) * 365) : ""}
      </p>
      {sortedRows.map(({ key, text, dotClass, valueClass }) => (
        <div key={key} className="flex items-center justify-between gap-8 tabular-nums py-0.5">
          <span className="flex items-center gap-2 text-foreground">
            <span className={`h-2 w-2 shrink-0 rounded-full ${dotClass}`} aria-hidden />
            {text}
          </span>
          <span className={`font-semibold ${valueClass}`}>
            {map[key] != null ? `${map[key].toFixed(2)}%` : "—"}
          </span>
        </div>
      ))}
    </div>
  );
}

// --- "Risk at Key Timepoints" selection logic (disabled) ---
// interface KeyTimepointCard {
//   timeLabel: string;
//   risk: number;
//   thresholdLow: number;
//   thresholdHigh: number;
//   thresholdAverage: number;
//   category: RiskCategory;
// }
//
// const KEY_TIMEPOINT_START_DAYS = 0.5 * 365.25;
// const KEY_TIMEPOINT_GAP_DAYS = 0.5 * 365.25;
//
// /**
//  * Pick up to two worst timepoints after 0.5 years, keeping them chronological.
//  * The selection prefers, in order:
//  * - the first observed crossing above the high threshold,
//  * - the closest point below the high threshold,
//  * - the closest point below the average threshold.
//  * The second point must be at least 0.5 years after the first.
//  */
// function pickKeyTimepoints(survivalCurve: SurvivalPoint[]): KeyTimepointCard[] {
//   const eligiblePoints = survivalCurve
//     .filter((p) => p.category !== "low" && p.time >= KEY_TIMEPOINT_START_DAYS)
//     .sort((a, b) => a.time - b.time);
//
//   if (eligiblePoints.length === 0) return [];
//
//   const pickWorstFallbackPoint = (points: SurvivalPoint[]) => {
//     if (points.length === 0) return undefined;
//
//     const closestBelowHigh = points
//       .filter((point) => point.risk < point.thresholdHigh)
//       .reduce<SurvivalPoint | undefined>((best, point) => {
//         if (!best) return point;
//         const bestDistance = best.thresholdHigh - best.risk;
//         const currentDistance = point.thresholdHigh - point.risk;
//         if (currentDistance < bestDistance) return point;
//         if (currentDistance > bestDistance) return best;
//         return point.time < best.time ? point : best;
//       }, undefined);
//
//     if (closestBelowHigh) {
//       return closestBelowHigh;
//     }
//
//     const closestBelowAverage = points
//       .filter((point) => point.risk < point.thresholdAverage)
//       .reduce<SurvivalPoint | undefined>((best, point) => {
//         if (!best) return point;
//         const bestDistance = best.thresholdAverage - best.risk;
//         const currentDistance = point.thresholdAverage - point.risk;
//         if (currentDistance < bestDistance) return point;
//         if (currentDistance > bestDistance) return best;
//         return point.time < best.time ? point : best;
//       }, undefined);
//
//     return closestBelowAverage;
//   };
//
//   const highCrossings = eligiblePoints.filter((point, index) => {
//     if (point.risk < point.thresholdHigh) return false;
//     if (index === 0) return true;
//     return eligiblePoints[index - 1].risk < eligiblePoints[index - 1].thresholdHigh;
//   });
//
//   const firstPoint = highCrossings[0] ?? pickWorstFallbackPoint(eligiblePoints);
//   if (!firstPoint) return [];
//
//   const laterPoints = eligiblePoints.filter((point) => point.time >= firstPoint.time + KEY_TIMEPOINT_GAP_DAYS);
//   const secondHighCrossing = highCrossings.find((point) => point.time >= firstPoint.time + KEY_TIMEPOINT_GAP_DAYS);
//   const secondPoint = secondHighCrossing ?? pickWorstFallbackPoint(laterPoints);
//
//   return [firstPoint, secondPoint]
//     .filter((point): point is SurvivalPoint => Boolean(point))
//     .sort((a, b) => a.time - b.time)
//     .map((point) => ({
//       timeLabel: formatYearsAndMonthsFromDays(point.time),
//       risk: point.risk,
//       thresholdLow: point.thresholdLow,
//       thresholdHigh: point.thresholdHigh,
//       thresholdAverage: point.thresholdAverage,
//       category: point.category,
//     }));
// }

const RiskCurve = ({ survivalCurve }: RiskCurveProps) => {
  const xAxisTicks = [0.5, 1, 2, 3, 4, 5];

  const formatXAxisTick = (value: number) => {
    if (value === 0.5) return "6M";
    if (value === 1) return "12M";
    return `${value}Y`;
  };

  const chartData = survivalCurve
    .filter((_, i) => i % 6 === 0 || i === survivalCurve.length - 1)
    .map((d) => ({
      years: +(d.time / 365).toFixed(2),
      risk: d.risk * 100,
      thresholdLow: d.thresholdLow * 100,
      thresholdHigh: d.thresholdHigh * 100,
      thresholdAverage: d.thresholdAverage * 100,
      zoneLow: d.thresholdLow * 100,
      zoneIntermediate: (d.thresholdAverage - d.thresholdLow) * 100,
      zoneAverage: (d.thresholdHigh - d.thresholdAverage) * 100,
    }));

  const chartMax = useMemo(() => {
    const maxValue = survivalCurve.reduce((acc, p) => {
      const localMax = Math.max(
        Number.isFinite(p.risk) ? p.risk : 0,
        Number.isFinite(p.thresholdLow) ? p.thresholdLow : 0,
        Number.isFinite(p.thresholdAverage) ? p.thresholdAverage : 0,
        Number.isFinite(p.thresholdHigh) ? p.thresholdHigh : 0
      );
      return Math.max(acc, localMax);
    }, 0);

    // Values are expected in [0,1], but tolerate percentage inputs too.
    const normalizedPercent = maxValue <= 1.5 ? maxValue * 100 : maxValue;
    const padded = normalizedPercent * 1.08;
    const bounded = Math.min(Math.max(padded, 1), 100);
    return Number.isFinite(bounded) ? bounded : 10;
  }, [survivalCurve]);

  const chartDataWithZones = useMemo(
    () => chartData.map((p) => ({ ...p, zoneHigh: Math.max(chartMax - p.thresholdHigh, 0) })),
    [chartData, chartMax]
  );

  // const keyTimepoints = useMemo(() => pickKeyTimepoints(survivalCurve), [survivalCurve]);

  return (
    <div className="space-y-4">
      <Card className="border-border/60 shadow-md">
        <CardHeader className="px-4 pt-4 pb-2">
          <CardTitle className="text-base font-semibold tracking-tight">
            Cumulative Risk Over Time
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            <span className="text-emerald-600">green</span> = low, {" "}
            <span className="text-yellow-600">yellow</span> = below average, {" "}
            <span className="text-orange-600">orange</span> = above average, {" "}
            <span className="text-red-600">red</span> = high
          </p>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <div className="h-[340px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartDataWithZones} margin={{ top: 10, right: 10, left: 0, bottom: 26 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="years"
                  type="number"
                  domain={[0.5, 5]}
                  ticks={xAxisTicks}
                  tickFormatter={formatXAxisTick}
                  label={{ value: "Time (M=months, Y=years)", position: "bottom", offset: 8, style: { fill: "hsl(var(--muted-foreground))", fontSize: 12 } }}
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                  stroke="hsl(var(--border))"
                />
                <YAxis
                  label={{ value: "Risk (%)", angle: -90, position: "insideLeft", offset: 10, style: { fill: "hsl(var(--muted-foreground))", fontSize: 12 } }}
                  tickFormatter={(value) => Number(value).toLocaleString(undefined, { maximumFractionDigits: 1 })}
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                  stroke="hsl(var(--border))"
                  domain={[0, chartMax]}
                />
                <Tooltip
                  cursor={{ stroke: "hsl(var(--border))", strokeWidth: 1, strokeDasharray: "4 4" }}
                  wrapperStyle={{ outline: "none", zIndex: 40 }}
                  allowEscapeViewBox={{ x: true, y: true }}
                  animationDuration={200}
                  content={(props) => <RiskChartTooltip {...props} />}
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
                {/* 4-zone background bands */}
                <Area
                  type="monotone"
                  dataKey="zoneLow"
                  stroke="none"
                  fill="#10b981"
                  fillOpacity={0.08}
                  activeDot={false}
                  stackId="zones"
                />
                <Area
                  type="monotone"
                  dataKey="zoneIntermediate"
                  stroke="none"
                  fill="#eab308"
                  fillOpacity={0.08}
                  activeDot={false}
                  stackId="zones"
                />
                <Area
                  type="monotone"
                  dataKey="zoneAverage"
                  stroke="none"
                  fill="#f97316"
                  fillOpacity={0.1}
                  activeDot={false}
                  stackId="zones"
                />
                <Area
                  type="monotone"
                  dataKey="zoneHigh"
                  stroke="none"
                  fill="#ef4444"
                  fillOpacity={0.08}
                  activeDot={false}
                  stackId="zones"
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
                  dataKey="thresholdAverage"
                  stroke="#f97316"
                  strokeWidth={1.5}
                  strokeDasharray="4 4"
                  dot={false}
                  name="thresholdAverage"
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
                <Line
                  type="monotone"
                  dataKey="risk"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2.5}
                  dot={false}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* "Risk at Key Timepoints" card disabled — uncomment below (and the
          companion blocks: Badge import, categoryConfig, pickKeyTimepoints,
          keyTimepoints useMemo above) to re-enable.
      <Card className="border-border/60 shadow-md">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold tracking-tight">
            Risk at Key Timepoints
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            {keyTimepoints.length > 0
              ? "Showing the two worst regional recurrence prognosis timepoints in chronological order."
              : "Patient with low risk."}
          </p>
        </CardHeader>
        <CardContent>
          {keyTimepoints.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {keyTimepoints.map((yr, idx) => {
                const cat = categoryConfig[yr.category];
                return (
                  <div
                    key={`key-tp-${idx}`}
                    className="text-center rounded-lg border border-border/40 bg-muted/30 p-3"
                  >
                    <div className="text-xl font-bold text-foreground mt-1">
                      {(yr.risk * 100).toFixed(2)}%
                    </div>
                    <Badge variant="outline" className={`mt-1.5 text-[10px] px-1.5 py-0 ${cat.className}`}>
                      {cat.label}
                    </Badge>
                    <div className="text-xs text-muted-foreground font-medium leading-snug px-0.5">
                      {yr.timeLabel}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-lg border border-border/40 bg-muted/30 p-4 text-center text-sm text-muted-foreground">
              Patient with low risk.
            </div>
          )}
        </CardContent>
      </Card>
      */}
    </div>
  );
};

export default RiskCurve;
