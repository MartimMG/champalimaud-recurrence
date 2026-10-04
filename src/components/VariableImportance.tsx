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

function formatHr(hr: number): string {
  return String(Number(hr.toPrecision(2)));
}

// Mantissas per decade, coarsest first. Every set contains 1, so HR = 1 is always a tick.
const TICK_MANTISSAS = [
  [1],
  [1, 2, 5],
  [1, 1.5, 2, 3, 5, 7],
  [1, 1.1, 1.2, 1.3, 1.5, 1.7, 2, 2.5, 3, 4, 5, 6, 7, 8, 9],
];

// Domain is in log-HR; returns tick positions in log-HR, picking the finest set of
// HR values (0.5, 1, 2, ...) that still fits within targetCount.
function computeLogTicks(domainMin: number, domainMax: number, targetCount: number): number[] {
  if (domainMin === domainMax) return [0];
  const firstDecade = Math.floor(domainMin / Math.LN10);
  const lastDecade = Math.ceil(domainMax / Math.LN10);
  let best: number[] = [0];
  for (const mantissas of TICK_MANTISSAS) {
    const ticks = new Set<number>();
    for (let k = firstDecade; k <= lastDecade; k++) {
      for (const m of mantissas) {
        const logHr = Math.log(Number((m * 10 ** k).toPrecision(3)));
        if (logHr >= domainMin - 1e-9 && logHr <= domainMax + 1e-9) ticks.add(logHr);
      }
    }
    if (ticks.size > targetCount) break;
    best = [...ticks].sort((a, b) => a - b);
  }
  return best;
}

const VariableImportance = ({ contributions, input }: VariableImportanceProps) => {
  const items = contributions.map((c) => {
    const fullName = formatUiVariableLabel(c.name);
    const valueLabel = getValueLabelForGroup(fullName, input);
    // Bars are plotted in log-HR (c.contribution) on a log axis labelled in HR, so
    // HR 0.5 and HR 2 sit equally far from 1.
    return {
      key: c.name,
      fullName,
      valueLabel,
      logHr: c.contribution,
      hr: Math.exp(c.contribution),
      direction: c.contribution >= 0 ? ("risk" as const) : ("protective" as const),
    };
  });

  // Stable DOM/key order (alphabetical, independent of value) so React keeps the same
  // elements across renders — only their computed rank/position changes, which lets the
  // CSS "top" transition animate a smooth reorder instead of labels snapping instantly.
  const stableItems = [...items].sort((a, b) => a.key.localeCompare(b.key));
  const rankedByValue = [...items].sort((a, b) => Math.abs(b.logHr) - Math.abs(a.logHr));
  const rankByKey = new Map(rankedByValue.map((item, index) => [item.key, index]));

  const rawValues = items.map((d) => d.logHr);
  const rawMin = Math.min(0, ...rawValues);
  const rawMax = Math.max(0, ...rawValues);
  const range = rawMax - rawMin || 1;
  const pad = range * 0.1;
  const domainMin = rawMin < 0 ? rawMin - pad : 0;
  const domainMax = rawMax > 0 ? rawMax + pad : 0;

  const ticks = computeLogTicks(domainMin, domainMax, TICK_COUNT);
  const zeroPercent = toPercent(0, domainMin, domainMax);

  const rowsHeight = items.length * ROW_HEIGHT;

  return (
    <Card className="border-border/60 shadow-md">
      <CardHeader className="px-4 pt-4 pb-2">
        <CardTitle className="text-base font-semibold tracking-tight">
          Variable Contributions to Risk
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Hazard ratio for each variable (log scale).{" "}
          <span className="text-destructive font-medium">Red</span> increases risk,{" "}
          <span className="text-accent-foreground font-medium" style={{ color: "hsl(var(--accent))" }}>
            teal
          </span>{" "}
          decreases risk.
        </p>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        {/* Purely decorative — the actual data is exposed to assistive tech via the
            sr-only table below, so screen readers skip this whole visual chart. */}
        <div aria-hidden="true">
          <p className="mb-1 text-right text-xs text-muted-foreground">Hazard ratio</p>

          {/* Axis */}
          <div className="relative mb-1 h-5 text-[11px] text-muted-foreground" style={{ marginLeft: LABEL_WIDTH }}>
            {ticks.map((t, i) => (
              <span
                key={i}
                className="absolute -translate-x-1/2 tabular-nums"
                style={{ left: `${toPercent(t, domainMin, domainMax)}%` }}
              >
                {formatHr(Math.exp(t))}
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
              const valuePercent = toPercent(item.logHr, domainMin, domainMax);
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
                      HR {item.hr.toFixed(2)} (Value: {item.valueLabel})
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
          aria-label="Variable contributions to the patient's hazard, ordered from highest to lowest impact"
        >
          <div role="rowgroup">
            <div role="row">
              <span role="columnheader">Variable</span>
              <span role="columnheader">Selected value</span>
              <span role="columnheader">Hazard ratio</span>
              <span role="columnheader">Direction</span>
            </div>
          </div>
          <div role="rowgroup">
            {rankedByValue.map((item) => (
              <div role="row" key={item.key}>
                <span role="rowheader">{item.fullName}</span>
                <span role="cell">{item.valueLabel}</span>
                <span role="cell">{item.hr.toFixed(2)}</span>
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
