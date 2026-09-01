import { useEffect, useState, type ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { ArrowRight, ChevronRight, FlaskConical } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type SectionProps = {
  title: string;
  subtitle?: string;
  children: ReactNode;
};

const Section = ({ title, subtitle, children }: SectionProps) => {
  const [open, setOpen] = useState(false);

  return (
    <div
      className={`rounded-md border border-border/60 px-4 py-3 transition-colors hover:border-primary/40 ${open ? "bg-muted/30" : "bg-muted/20"}`}
    >
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        className="flex w-full cursor-pointer items-start gap-2 text-left text-sm font-medium text-foreground"
      >
        <ChevronRight
          className={`mt-0.5 h-4 w-4 shrink-0 transition-transform duration-200 ${open ? "rotate-90" : ""}`}
        />
        <span>
          {title}
          {subtitle ? (
            <span className="ml-2 font-normal text-muted-foreground">{subtitle}</span>
          ) : null}
        </span>
      </button>
      <div
        className="grid transition-[grid-template-rows] duration-300 ease-in-out"
        style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          <div className="mt-3 space-y-3 pl-6 text-sm text-muted-foreground [&_strong]:font-medium [&_strong]:text-foreground">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

const StatChip = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-lg border border-border/60 bg-card/70 px-3 py-2 text-center shadow-sm backdrop-blur-sm">
    <p className="text-sm font-semibold text-foreground sm:text-base">{value}</p>
    <p className="text-[11px] text-muted-foreground">{label}</p>
  </div>
);

const Table = ({ children }: { children: ReactNode }) => (
  <div className="overflow-x-auto">
    <table className="w-full min-w-[32rem] border-collapse text-xs">{children}</table>
  </div>
);

const Th = ({ children, className = "" }: { children: ReactNode; className?: string }) => (
  <th
    className={`border-b border-border/60 px-2 py-1.5 text-left font-medium text-foreground ${className}`}
  >
    {children}
  </th>
);

const Td = ({ children, className = "" }: { children: ReactNode; className?: string }) => (
  <td className={`border-b border-border/30 px-2 py-1.5 align-top ${className}`}>{children}</td>
);

const Landing = () => {
  const { hash } = useLocation();

  useEffect(() => {
    if (!hash) return;
    const el = document.querySelector(hash);
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [hash]);

  return (
    <main className="relative min-h-screen overflow-hidden bg-background">
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute -top-32 -left-24 h-72 w-72 rounded-full bg-primary/15 blur-3xl" />
        <div className="absolute top-24 -right-24 h-80 w-80 rounded-full bg-accent/15 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-5xl px-4 py-10 sm:px-6">
        <section className="mb-8 animate-in fade-in slide-in-from-bottom-4 text-center duration-700 sm:mb-10">
          <div className="mb-4 flex items-center justify-center gap-3">
            <img src="/logo.png" alt="App logo" className="h-12 w-12 rounded-xl object-cover shadow-sm" />
          </div>
          <h1 className="mx-auto max-w-3xl bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-2xl font-semibold tracking-tight text-transparent sm:text-4xl">
            Breast Cancer Regional Recurrence Risk Calculator
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-muted-foreground sm:text-base">
            Estimates five-year <strong className="font-medium text-foreground">regional lymph-node
            recurrence</strong> risk in early breast cancer, from a model fitted on 3,228 records from the
            Champalimaud Foundation.
          </p>

          <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild size="lg" className="gap-2 shadow-md shadow-primary/20">
              <Link to="/app">
                Go to Risk Calculator
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <a href="#methodology">View full methodology</a>
            </Button>
          </div>

          <div className="mx-auto mt-8 grid max-w-2xl grid-cols-2 gap-2 sm:grid-cols-4">
            <StatChip label="Lesion records" value="3,228" />
            <StatChip label="5-yr recurrences" value="27" />
            <StatChip label="C-index" value="0.91" />
            <StatChip label="Time horizon" value="5 years" />
          </div>
        </section>

        <Card className="w-full border-border/60 shadow-lg shadow-black/[0.03] animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150 fill-mode-backwards">
          <CardContent className="space-y-6 p-6 sm:p-8">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground sm:text-base">
                The Breast Cancer Regional Recurrence Risk Calculator is an interactive tool that estimates
                the risk of{" "}
                <strong className="font-medium text-foreground">regional lymph-node recurrence</strong> in
                early breast cancer, over the five years following diagnosis. It was developed for female
                patients with early breast cancer who have completed treatment.
              </p>
              <p className="text-sm text-muted-foreground sm:text-base">
                Some variables may not be directly related with the shown impact, but may have some
                underlying information that contributes to the risk.
              </p>
            </div>

            <div className="rounded-md border border-border/60 bg-muted/30 p-4">
              <p className="text-sm font-medium text-foreground">In one paragraph</p>
              <p className="mt-2 text-sm text-muted-foreground">
                A LASSO-penalised Cox proportional hazards model was fitted to 3,228 early breast cancer
                records (2,971 patients) from the BreastCare database of the Champalimaud Foundation, with
                follow-up administratively censored at five years. Within that window there were{" "}
                <strong className="font-medium text-foreground">27 regional recurrences</strong>. The
                calculator turns the model&apos;s predicted absolute risk into four risk zones. The section
                below summarises how that was done.
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                The event count is small. Every number on this page should be read together with its
                confidence interval.
              </p>
            </div>

            <div id="methodology" className="scroll-mt-6 space-y-2">
              <h2 className="text-sm font-semibold tracking-tight text-foreground">
                Methods
              </h2>

              <Section title="Data and cohort" subtitle="3,228 records, 27 events in 5 years">
                <p>
                  Data come from the <strong>BreastCare database of the Champalimaud Foundation</strong>{" "}
                  (Lisbon, Portugal), spanning roughly 22 years of diagnoses. After restricting to early
                  breast cancer and capping follow-up at five years, the analysis cohort held{" "}
                  <strong>3,228 lesion records from 2,971 patients</strong>, with{" "}
                  <strong>27 regional recurrences</strong> (0.84%) inside that window.
                </p>
              </Section>

              <Section title="Model" subtitle="LASSO-penalised Cox proportional hazards">
                <p>
                  The deployed model is a <strong>Cox proportional hazards model with a LASSO penalty</strong>,
                  chosen by cross-validation from 30 candidate predictors covering diagnostic and treatment
                  variables. It was preferred over three alternative models (random survival forest,
                  survival SVM, gradient boosting) that scored statistically indistinguishably, because it
                  stays interpretable and reports calibrated absolute risk rather than a bare ranking.
                </p>
                <p>
                  Only <strong>11 of the 29 candidate variables</strong> kept a non-zero coefficient. Treatment-related coefficients
                  in particular should not be read causally: treatment was assigned by clinicians who
                  already knew each patient&apos;s risk.
                </p>
              </Section>

              <Section title="Performance" subtitle="C-index 0.91, well calibrated in aggregate">
                <p>
                  Discrimination and calibration were assessed with a 500-replicate bootstrap. The
                  optimism-corrected <strong>C-index is 0.91</strong> (95% interval 0.86–0.96) with 0.91 in the test set, and
                  predicted risk matches observed risk closely in aggregate at 1, 3 and 5 years.
                </p>
              </Section>

              <Section title="Risk zones" subtitle="four zones, three thresholds">
                <p>
                  Predicted risk is also translated into four zones — low, mid-low, mid-high and high —
                  using thresholds set so the high-risk zone captures roughly the riskiest{" "}
                  <strong>15% of the cohort</strong>. This cutoff is a capacity choice, not a clinical
                  optimum: it does not change the model or any individual&apos;s predicted risk, only where
                  the line is drawn on the same ranking, and a different cutoff could be used instead.
                </p>
              </Section>

              <Section title="Limitations" subtitle="read before using any number from this tool">
                <ul className="list-disc space-y-1 pl-5">
                  <li>
                    <strong>Only 27 events</strong>, so confidence intervals are wide throughout.
                  </li>
                  <li>
                    <strong>Single centre, retrospective</strong>, with no external or temporal validation.
                  </li>
                  <li>
                    <strong>Treatment variables are confounded by indication</strong> and should not be read
                    causally.
                  </li>
                  <li>
                    <strong>No competing risks</strong> — death and distant metastasis are treated as
                    censoring, which biases regional-recurrence risk upward.
                  </li>
                </ul>
              </Section>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
};

export default Landing;
