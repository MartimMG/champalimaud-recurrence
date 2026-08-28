import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { type FeatureContribution, type PatientInput } from "@/lib/coxModel";
import { formatUiVariableLabel, getValueLabelForGroup } from "@/lib/variableLabels";

interface VariableImportanceProps {
  contributions: FeatureContribution[];
  input: PatientInput;
}

const ROW_HEIGHT = 36;
const LABEL_WIDTH = 250;
const BAR_HEIGHT = 18;
const TICK_COUNT = 9;

function toPercent(value: number, domainMin: number, domainMax: number): number {
  if (domainMax === domainMin) return 50;
  return ((value - domainMin) / (domainMax - domainMin)) * 100;
}

function formatTick(value: number, range: number): string {
  const decimals = range < 1 ? 2 : range < 10 ? 1 : 0;
  const formatted = value.toFixed(decimals);
  return formatted === `-${(0).toFixed(decimals)}` ? (0).toFixed(decimals) : formatted;
}

function niceStep(rawStep: number): number {
  const exponent = Math.floor(Math.log10(rawStep));
  const fraction = rawStep / 10 ** exponent;
  const niceFraction = fraction <= 1 ? 1 : fraction <= 2 ? 2 : fraction <= 5 ? 5 : 10;
  return niceFraction * 10 ** exponent;
}

// Builds ticks by stepping out from 0 in both directions, so 0 is always included
// regardless of the data's actual min/max (unlike evenly dividing [domainMin, domainMax]).
function computeTicks(domainMin: number, domainMax: number, targetCount: number): number[] {
  if (domainMin === domainMax) return [0];
  const rawStep = (domainMax - domainMin) / Math.max(1, targetCount - 1);
  const step = niceStep(rawStep);
  const ticks = [0];
  for (let v = step; v <= domainMax + 1e-9; v += step) ticks.push(+v.toFixed(10));
  for (let v = -step; v >= domainMin - 1e-9; v -= step) ticks.push(+v.toFixed(10));
  return ticks.sort((a, b) => a - b);
}

const VariableImportance = ({ contributions, input }: VariableImportanceProps) => {
  const items = contributions.map((c) => {
    const fullName = formatUiVariableLabel(c.name);
    const valueLabel = getValueLabelForGroup(fullName, input);
    return {
      key: c.name,
      fullName,
      valueLabel,
      contribution: +c.contribution.toFixed(4),
      direction: c.contribution >= 0 ? ("risk" as const) : ("protective" as const),
    };
  });

  // Stable DOM/key order (alphabetical, independent of value) so React keeps the same
  // elements across renders — only their computed rank/position changes, which lets the
  // CSS "top" transition animate a smooth reorder instead of labels snapping instantly.
  const stableItems = [...items].sort((a, b) => a.key.localeCompare(b.key));
  const rankedByValue = [...items].sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution));
  const rankByKey = new Map(rankedByValue.map((item, index) => [item.key, index]));

  const rawValues = items.map((d) => d.contribution);
  const rawMin = Math.min(0, ...rawValues);
  const rawMax = Math.max(0, ...rawValues);
  const range = rawMax - rawMin || 1;
  const pad = range * 0.1;
  const domainMin = rawMin < 0 ? rawMin - pad : 0;
  const domainMax = rawMax > 0 ? rawMax + pad : 0;
  const domainRange = domainMax - domainMin || 1;

  const ticks = computeTicks(domainMin, domainMax, TICK_COUNT);
  const zeroPercent = toPercent(0, domainMin, domainMax);

  const rowsHeight = items.length * ROW_HEIGHT;

  return (
    <Card className="border-border/60 shadow-md">
      <CardHeader className="px-4 pt-4 pb-2">
        <CardTitle className="text-base font-semibold tracking-tight">
          Variable Contributions to Risk
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
      <CardContent className="px-4 pb-4">
        {/* Purely decorative — the actual data is exposed to assistive tech via the
            sr-only table below, so screen readers skip this whole visual chart. */}
        <div aria-hidden="true">
          <p className="mb-1 text-right text-xs text-muted-foreground">%</p>

          {/* Axis */}
          <div className="relative mb-1 h-5 text-[11px] text-muted-foreground" style={{ marginLeft: LABEL_WIDTH }}>
            {ticks.map((t, i) => (
              <span
                key={i}
                className="absolute -translate-x-1/2 tabular-nums"
                style={{ left: `${toPercent(t, domainMin, domainMax)}%` }}
              >
                {formatTick(t, domainRange)}
              </span>
            ))}
          </div>

          <div className="relative" style={{ height: rowsHeight }}>
            {/* Gridlines */}
            <div className="absolute inset-y-0" style={{ left: LABEL_WIDTH, right: 0 }}>
              {ticks.map((t, i) => (
                <div
                  key={i}
                  className="absolute top-0 bottom-0 border-l border-dashed border-border"
                  style={{ left: `${toPercent(t, domainMin, domainMax)}%` }}
                />
              ))}
            </div>

            {stableItems.map((item) => {
              const rank = rankByKey.get(item.key) ?? 0;
              const valuePercent = toPercent(item.contribution, domainMin, domainMax);
              const barLeft = Math.min(valuePercent, zeroPercent);
              const barWidth = Math.abs(valuePercent - zeroPercent);
              return (
                <div
                  key={item.key}
                  className="group absolute left-0 right-0 flex items-center transition-[top] duration-500 ease-in-out"
                  style={{ top: rank * ROW_HEIGHT, height: ROW_HEIGHT }}
                >
                  <div
                    className="shrink-0 pr-2 text-right text-xs leading-tight text-foreground"
                    style={{ width: LABEL_WIDTH }}
                  >
                    {item.fullName} <span className="font-bold">[{item.valueLabel}]</span>
                  </div>
                  <div className="relative h-full flex-1">
                    <div
                      className="absolute top-1/2 -translate-y-1/2 rounded transition-all duration-500 ease-in-out"
                      style={{
                        left: `${barLeft}%`,
                        width: `${barWidth}%`,
                        height: BAR_HEIGHT,
                        backgroundColor: item.direction === "risk" ? "hsl(var(--destructive))" : "hsl(var(--accent))",
                        opacity: 0.85,
                      }}
                    />
                    <div
                      className="pointer-events-none absolute -top-1 z-20 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-md border border-border bg-card px-2 py-1 text-xs text-foreground opacity-0 shadow-md transition-opacity duration-500 group-hover:opacity-100"
                      style={{ left: `${valuePercent}%` }}
                    >
                      {item.contribution > 0 ? "+" : ""}
                      {item.contribution.toFixed(4)} (Value: {item.valueLabel})
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Screen-reader-only equivalent of the chart above, ordered by impact (highest first).
            Built from divs with ARIA table roles rather than a real <table> — a real <table>'s
            row height can't be shrunk below its (nowrap) cell content no matter what CSS you
            throw at it, and that oversized absolutely-positioned box was inflating the page's
            scrollable height even though nothing was visibly painted. Screen readers expose
            ARIA table roles identically to real table markup. */}
        <div
          className="sr-only"
          role="table"
          aria-label="Variable contributions to the patient's risk score, ordered from highest to lowest impact"
        >
          <div role="rowgroup">
            <div role="row">
              <span role="columnheader">Variable</span>
              <span role="columnheader">Selected value</span>
              <span role="columnheader">Contribution</span>
              <span role="columnheader">Direction</span>
            </div>
          </div>
          <div role="rowgroup">
            {rankedByValue.map((item) => (
              <div role="row" key={item.key}>
                <span role="rowheader">{item.fullName}</span>
                <span role="cell">{item.valueLabel}</span>
                <span role="cell">
                  {item.contribution > 0 ? "+" : ""}
                  {item.contribution.toFixed(4)}
                </span>
                <span role="cell">{item.direction === "risk" ? "Increases risk" : "Decreases risk (protective)"}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default VariableImportance;
