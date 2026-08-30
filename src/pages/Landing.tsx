import { useEffect, type ReactNode } from "react";
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

const Section = ({ title, subtitle, children }: SectionProps) => (
  <details className="group rounded-md border border-border/60 bg-muted/20 px-4 py-3 transition-colors open:bg-muted/30 hover:border-primary/40">
    <summary className="flex cursor-pointer list-none items-start gap-2 text-sm font-medium text-foreground">
      <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 transition-transform group-open:rotate-90" />
      <span>
        {title}
        {subtitle ? (
          <span className="ml-2 font-normal text-muted-foreground">{subtitle}</span>
        ) : null}
      </span>
    </summary>
    <div className="mt-3 space-y-3 pl-6 text-sm text-muted-foreground [&_strong]:font-medium [&_strong]:text-foreground">
      {children}
    </div>
  </details>
);

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
    el?.scrollIntoView();
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
            <StatChip label="C-index (95% CI)" value="0.91 (0.86–0.96)" />
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
                <strong className="font-medium text-foreground">27 regional recurrences</strong>. The calculator turns the model&apos;s predicted absolute
                risk into four risk zones using three threshold curves. Everything below
                states how each of those steps was done, what was measured, and what was rejected along the
                way.
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                The event count is small. Every number on this page should be read together with its
                confidence interval.
              </p>
            </div>

            <div id="methodology" className="scroll-mt-6 space-y-2">
              <h2 className="text-sm font-semibold tracking-tight text-foreground">
                Full methods and transparency
              </h2>

              <Section title="1. What the model predicts" subtitle="outcome, time scale, output">
                <p>
                  The outcome is the <strong>first regional lymph-node recurrence</strong> after a diagnosis
                  of early breast cancer. Time is measured in days from the date of diagnosis to the date of
                  the first regional recurrence, or to the last follow-up date for patients who did not
                  recur.
                </p>
                <p>
                  The model returns <strong>absolute cumulative risk</strong>, 1 − S(t), on a daily grid from
                  day 1 to day 1,825 (5 years), where S(t) is the individual survival function from the Cox
                  model with a fitted Breslow baseline hazard. The first regional recurrence in the cohort
                  occurred on <strong>day 75</strong>, so the model assigns a predicted risk of exactly zero
                  to every patient before that day. This is a property of the data, not of the individual.
                </p>
              </Section>

              <Section
                title="2. Data source and cohort construction"
                subtitle="3,228 records, 27 events in 5 years"
              >
                <p>
                  Data come from the <strong>BreastCare database of the Champalimaud Foundation</strong>{" "}
                  (Lisbon, Portugal), a retrospective single-centre registry. The extraction used here spans
                  roughly 22 years of diagnoses.
                </p>
                <p>Records were selected as follows:</p>
                <ul className="list-disc space-y-1 pl-5">
                  <li>
                    Restricted to <strong>early breast cancer</strong> (the registry&apos;s EBC flag).
                  </li>
                  <li>
                    Records with a missing or unusable diagnosis date, or with a non-positive time to event,
                    were removed.
                  </li>
                  <li>
                    Where a patient appeared more than once with a recorded recurrence, only the first such
                    row was kept.
                  </li>
                  <li>
                    Follow-up was <strong>administratively censored at 1,826 days</strong>. Any record with
                    longer follow-up had its time set to the cap and its event status set to censored: 1,148
                    records (35.6%) were affected.
                  </li>
                </ul>
                <p>The resulting analysis cohort:</p>
                <Table>
                  <tbody>
                    <tr>
                      <Td className="font-medium text-foreground">Records</Td>
                      <Td>3,228 lesion records, from 2,971 distinct patients</Td>
                    </tr>
                    <tr>
                      <Td className="font-medium text-foreground">Regional recurrences within 5 years</Td>
                      <Td>27 (0.84%); 33 over the complete, uncapped follow-up</Td>
                    </tr>
                    <tr>
                      <Td className="font-medium text-foreground">Follow-up before the cap</Td>
                      <Td>median 1,342 days (IQR 698–1,970), range 25–7,492</Td>
                    </tr>
                    <tr>
                      <Td className="font-medium text-foreground">Earliest observed event</Td>
                      <Td>day 75</Td>
                    </tr>
                  </tbody>
                </Table>
                <p className="pt-1">
                  <strong>Cohort characteristics</strong> (n = 3,228 records; values as recorded, before
                  scaling):
                </p>
                <Table>
                  <thead>
                    <tr>
                      <Th>Characteristic</Th>
                      <Th>Value</Th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <Td>Age at diagnosis (years)</Td>
                      <Td>mean 55.2 ± 12.5; median 54 (IQR 46–65); range 20–89</Td>
                    </tr>
                    <tr>
                      <Td>Ki-67 at core biopsy (%)</Td>
                      <Td>median 25 (IQR 16–40)</Td>
                    </tr>
                    <tr>
                      <Td>Oestrogen receptor positive</Td>
                      <Td>2,655 (82.2%)</Td>
                    </tr>
                    <tr>
                      <Td>Progesterone receptor positive</Td>
                      <Td>2,129 (66.0%)</Td>
                    </tr>
                    <tr>
                      <Td>HER2 by immunohistochemistry — 2+ / 3+</Td>
                      <Td>402 (12.5%) / 307 (9.5%)</Td>
                    </tr>
                    <tr>
                      <Td>Grade at core biopsy — G2 / G3</Td>
                      <Td>1,933 (59.9%) / 689 (21.3%)</Td>
                    </tr>
                    <tr>
                      <Td>Nodal status — N1 / N2–N3</Td>
                      <Td>697 (21.6%) / 83 (2.6%)</Td>
                    </tr>
                    <tr>
                      <Td>Invasive type at core biopsy</Td>
                      <Td>2,775 (86.0%)</Td>
                    </tr>
                    <tr>
                      <Td>Radiotherapy performed</Td>
                      <Td>2,809 (87.0%)</Td>
                    </tr>
                    <tr>
                      <Td>RT to chest wall / supraclavicular area / internal mammary chain</Td>
                      <Td>2,816 (87.2%) / 854 (26.5%) / 63 (2.0%)</Td>
                    </tr>
                    <tr>
                      <Td>Total administered RT dose (as recorded)</Td>
                      <Td>median 41 (IQR 41–41); 616 records (19.1%) recorded as 0</Td>
                    </tr>
                    <tr>
                      <Td>Boost dose administered</Td>
                      <Td>median 3 (IQR 0–3); 910 records (28.2%) recorded as 0</Td>
                    </tr>
                    <tr>
                      <Td>Hormone therapy prescribed</Td>
                      <Td>2,580 (79.9%)</Td>
                    </tr>
                    <tr>
                      <Td>Chemotherapy performed / adjuvant chemotherapy</Td>
                      <Td>1,165 (36.1%) / 428 (13.3%)</Td>
                    </tr>
                    <tr>
                      <Td>Hormone therapy in association with chemotherapy</Td>
                      <Td>1,236 (38.3%)</Td>
                    </tr>
                    <tr>
                      <Td>Adjuvant biological therapy</Td>
                      <Td>381 (11.8%)</Td>
                    </tr>
                    <tr>
                      <Td>Neoadjuvant-only biological therapy (derived)</Td>
                      <Td>182 (5.6%)</Td>
                    </tr>
                    <tr>
                      <Td>Left / right lesion</Td>
                      <Td>1,688 (52.3%) / 1,540 (47.7%)</Td>
                    </tr>
                  </tbody>
                </Table>
              </Section>

              <Section
                title="3. Variables, missing data and preprocessing"
                subtitle="30 candidate predictors"
              >
                <p>
                  Thirty candidate predictors entered the model: <strong>13 treatment variables</strong>{" "}
                  (radiotherapy performed; chest wall, supraclavicular and internal mammary chain fields;
                  conventional RT fraction; total administered dose; boost dose; hormone therapy state;
                  hormone therapy in association with chemotherapy; chemotherapy performed; adjuvant
                  chemotherapy; adjuvant biological therapy; neoadjuvant-only biological therapy) and{" "}
                  <strong>17 diagnostic variables</strong> (age, Ki-67, lesion side, grade, isotype, HER2,
                  type of invasion, ER, PR, nodal status, and two diagnostic-panel missingness indicators).
                </p>
                <p>Missing values were handled deliberately rather than uniformly:</p>
                <ul className="list-disc space-y-1 pl-5">
                  <li>
                    <strong>Mode imputation</strong> for grade, lesion side, nodal status, type of invasion
                    and isotype.
                  </li>
                  <li>
                    <strong>Median imputation</strong> for the continuous diagnostic variables (age, Ki-67).
                  </li>
                  <li>
                    <strong>ER, PR and HER2 were not imputed.</strong> They were one-hot encoded with an
                    explicit <em>missing</em> level. The reason is that their missingness is structured, not
                    random: the three fields go missing together in a small number of recurring patterns, the
                    indicators are near-deterministically associated with one another, and missingness tracks
                    the year of diagnosis — practice around ordering and recording a full core-biopsy panel
                    changed over the two decades the cohort spans. That rules out
                    missing-completely-at-random, so an unconditional fill would have invented information.
                    The recurring patterns are carried into the model as two indicator variables (
                    <em>diagnostic panel missingness pattern</em>), present in 304 (9.4%) and 130 (4.0%) of
                    records.
                  </li>
                  <li>
                    <strong>Treatment fields</strong> with no recorded value were set to 0, i.e. read as
                    &ldquo;not administered / not recorded&rdquo;.
                  </li>
                </ul>
                <p>
                  Categorical variables with more than two levels (grade, nodal status, isotype) were one-hot
                  encoded with the first level dropped as reference. The five continuous variables (age,
                  Ki-67, conventional RT fraction, total administered dose, boost dose) were{" "}
                  <strong>min–max scaled</strong>. The scaler was fitted once on the full cohort and is
                  shipped inside the deployed model file, so the calculator applies exactly the same
                  transformation to your input as was applied during fitting.
                </p>
              </Section>

              <Section title="4. Model and regularization" subtitle="LASSO-penalised Cox, α = 8.53 × 10⁻⁴">
                <p>
                  The model is a <strong>Cox proportional hazards model with an elastic-net penalty</strong>{" "}
                  (<code>CoxnetSurvivalAnalysis</code>, scikit-survival 0.25.0), fitted with a Breslow
                  baseline hazard so that absolute risk, not only relative risk, can be reported.
                </p>
                <p>
                  The penalty was set to <strong>pure LASSO (L1 ratio = 1.0)</strong> with{" "}
                  <strong>α = 0.000853168</strong>. Those two values were selected by{" "}
                  <strong>repeated stratified cross-validation</strong>: 4 folds × 5 repeats, stratified on
                  the event indicator so that every fold carried a comparable share of the 27 events, scored
                  by Harrell&apos;s C-index over a grid of 23 log-spaced α values (≈ 9 × 10⁻⁵ to 10⁻¹) and 6
                  L1 ratios (0.001, 0.01, 0.1, 0.5, 0.8, 1.0) — 127 evaluated configurations.
                </p>
                <p>
                  The deployed configuration scored a cross-validated C-index of{" "}
                  <strong>0.878 ± 0.055</strong>. The single best cell in the grid scored 0.885 ± 0.059 (α ≈
                  4.5 × 10⁻⁴, L1 ratio 0.01) — a difference far inside one standard deviation across folds.
                  Pure L1 was preferred at essentially equal accuracy because it produces a sparse, readable
                  model: <strong>9 of the 30 candidate variables kept a non-zero coefficient</strong>, and
                  the other 21 were shrunk exactly to zero and play no part in any prediction.
                </p>
                <p>
                  Cross-validation was used <strong>only to rank hyperparameters</strong>. Every performance
                  number reported in section 6 comes from a separate bootstrap procedure, so the same data
                  are not used both to choose the model and to praise it.
                </p>
                <p className="pt-1">
                  <strong>The nine retained variables.</strong> The hazard ratio is exp(coefficient) from the
                  final full-cohort fit. The interval is the 2.5th–97.5th percentile of that variable&apos;s
                  coefficient across the bootstrap replicates in which the penalty kept it, and
                  &ldquo;selected&rdquo; is the share of replicates in which it survived the penalty at all —
                  a direct measure of how stable that variable is.
                </p>
                <Table>
                  <thead>
                    <tr>
                      <Th>Variable</Th>
                      <Th className="text-right">Coef.</Th>
                      <Th className="text-right">HR</Th>
                      <Th className="text-right">95% interval</Th>
                      <Th className="text-right">Selected</Th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <Td>Oestrogen receptor positive</Td>
                      <Td className="text-right">−1.888</Td>
                      <Td className="text-right">0.15</Td>
                      <Td className="text-right">0.07–0.31</Td>
                      <Td className="text-right">100%</Td>
                    </tr>
                    <tr>
                      <Td>Neoadjuvant-only biological therapy</Td>
                      <Td className="text-right">+1.615</Td>
                      <Td className="text-right">5.03</Td>
                      <Td className="text-right">1.43–12.30</Td>
                      <Td className="text-right">99%</Td>
                    </tr>
                    <tr>
                      <Td>Radiotherapy performed</Td>
                      <Td className="text-right">−0.733</Td>
                      <Td className="text-right">0.48</Td>
                      <Td className="text-right">0.20–0.89</Td>
                      <Td className="text-right">91%</Td>
                    </tr>
                    <tr>
                      <Td>Radiotherapy on supraclavicular area</Td>
                      <Td className="text-right">+0.541</Td>
                      <Td className="text-right">1.72</Td>
                      <Td className="text-right">1.03–3.81</Td>
                      <Td className="text-right">86%</Td>
                    </tr>
                    <tr>
                      <Td>Isotype at core biopsy — other</Td>
                      <Td className="text-right">+0.682</Td>
                      <Td className="text-right">1.98</Td>
                      <Td className="text-right">1.09–6.09</Td>
                      <Td className="text-right">83%</Td>
                    </tr>
                    <tr>
                      <Td>High grade (G3) at core biopsy</Td>
                      <Td className="text-right">+0.420</Td>
                      <Td className="text-right">1.52</Td>
                      <Td className="text-right">1.04–3.28</Td>
                      <Td className="text-right">83%</Td>
                    </tr>
                    <tr>
                      <Td>Adjuvant biological therapy</Td>
                      <Td className="text-right">−0.212</Td>
                      <Td className="text-right">0.81</Td>
                      <Td className="text-right">0.40–0.98</Td>
                      <Td className="text-right">65%</Td>
                    </tr>
                    <tr>
                      <Td>Side location of the lesion</Td>
                      <Td className="text-right">−0.084</Td>
                      <Td className="text-right">0.92</Td>
                      <Td className="text-right">0.37–1.00</Td>
                      <Td className="text-right">59%</Td>
                    </tr>
                    <tr>
                      <Td>Hormone therapy with chemotherapy protocol</Td>
                      <Td className="text-right">+0.010</Td>
                      <Td className="text-right">1.01</Td>
                      <Td className="text-right">1.00–2.98</Td>
                      <Td className="text-right">49%</Td>
                    </tr>
                  </tbody>
                </Table>
                <p>
                  Read the bottom of that table with care. Lesion side and the hormone-therapy-with-
                  chemotherapy flag are kept in barely half of the bootstrap replicates and carry
                  coefficients close to zero; they are best understood as weak proxies for unrecorded
                  factors, not as effects. Treatment variables in an observational cohort also carry
                  confounding by indication: radiotherapy to the supraclavicular area, for instance, is given
                  to patients already judged to be at higher nodal risk, which is why it raises predicted
                  risk here. <strong>None of these coefficients should be read causally.</strong>
                </p>
              </Section>

              <Section
                title="5. Why a Cox model, and what it was compared against"
                subtitle="four model families, one protocol"
              >
                <p>
                  Three alternative survival models were tuned and evaluated under exactly the same protocol
                  — same cohort, same 5-year cap, same repeated stratified 4-fold cross-validation with 5
                  repeats, same scoring — so the comparison is like for like:
                </p>
                <Table>
                  <thead>
                    <tr>
                      <Th>Model</Th>
                      <Th className="text-right">Best cross-validated C-index</Th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <Td>LASSO-penalised Cox (deployed)</Td>
                      <Td className="text-right">0.885 ± 0.059</Td>
                    </tr>
                    <tr>
                      <Td>Gradient boosting survival analysis</Td>
                      <Td className="text-right">0.876 ± 0.057</Td>
                    </tr>
                    <tr>
                      <Td>Survival support vector machine</Td>
                      <Td className="text-right">0.852 ± 0.062</Td>
                    </tr>
                    <tr>
                      <Td>Random survival forest</Td>
                      <Td className="text-right">0.851 ± 0.075</Td>
                    </tr>
                  </tbody>
                </Table>
                <p>
                  No model family separated from the others by more than a fraction of the fold-to-fold
                  spread. The Cox model was deployed because, at equal discrimination, it produces a small
                  set of interpretable coefficients, yields a calibrated absolute risk over the whole
                  follow-up rather than a bare ranking, and is small and deterministic enough to ship. Global
                  feature-importance profiles (SurvSHAP) were also compared across the four models and ranked
                  broadly the same variables.
                </p>
              </Section>

              <Section
                title="6. How the model was validated, and how well it performs"
                subtitle="event-stratified bootstrap, 500 replicates"
              >
                <p>
                  Performance was estimated with an <strong>event-stratified bootstrap</strong>: 500
                  replicates, each resampling the cohort with replacement while preserving the ratio of
                  events to non-events, refitting <em>both</em> the scaler and the model on the in-bag rows,
                  and reading every metric on the out-of-bag rows that replicate never saw. (497 replicates
                  were usable for the threshold analysis and 495 for calibration; the rest failed to produce
                  a usable fit and are reported rather than dropped silently.) Optimism-corrected values use
                  the Efron–Harrell correction.
                </p>
                <p className="pt-1">
                  <strong>Discrimination</strong> (Harrell&apos;s C-index over the 5-year window):
                </p>
                <Table>
                  <tbody>
                    <tr>
                      <Td className="font-medium text-foreground">Apparent (full-cohort fit)</Td>
                      <Td>0.920</Td>
                    </tr>
                    <tr>
                      <Td className="font-medium text-foreground">Optimism-corrected</Td>
                      <Td>0.898 (95% interval 0.854–0.947); mean optimism +0.022</Td>
                    </tr>
                    <tr>
                      <Td className="font-medium text-foreground">Cross-validated (tuning run)</Td>
                      <Td>0.878 ± 0.055</Td>
                    </tr>
                  </tbody>
                </Table>
                <p className="pt-1">
                  <strong>Calibration.</strong> Observed risk is 1 − Ŝ(t) from the cohort Kaplan–Meier
                  estimator. O/E is observed over expected; the slope is the calibration slope, where 1.0 is
                  perfect.
                </p>
                <Table>
                  <thead>
                    <tr>
                      <Th>Horizon</Th>
                      <Th className="text-right">Events</Th>
                      <Th className="text-right">Observed</Th>
                      <Th className="text-right">Predicted</Th>
                      <Th className="text-right">O/E (out-of-bag)</Th>
                      <Th className="text-right">Slope (out-of-bag)</Th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <Td>1 year</Td>
                      <Td className="text-right">5</Td>
                      <Td className="text-right">0.16% (0.07–0.38)</Td>
                      <Td className="text-right">0.16%</Td>
                      <Td className="text-right">1.01 (0.00–5.38)</Td>
                      <Td className="text-right">1.25 (0.72–2.54)</Td>
                    </tr>
                    <tr>
                      <Td>3 years</Td>
                      <Td className="text-right">16</Td>
                      <Td className="text-right">0.62% (0.38–1.01)</Td>
                      <Td className="text-right">0.62%</Td>
                      <Td className="text-right">0.94 (0.42–2.15)</Td>
                      <Td className="text-right">1.44 (0.78–2.73)</Td>
                    </tr>
                    <tr>
                      <Td>5 years</Td>
                      <Td className="text-right">27</Td>
                      <Td className="text-right">1.34% (0.90–1.98)</Td>
                      <Td className="text-right">1.32%</Td>
                      <Td className="text-right">0.99 (0.55–1.49)</Td>
                      <Td className="text-right">1.05 (0.56–1.99)</Td>
                    </tr>
                  </tbody>
                </Table>
                <p>
                  In aggregate the model is well calibrated: total predicted risk matches total observed risk
                  to within a few percent at every horizon. The calibration slope above 1 at the earlier
                  horizons means the predicted risks are somewhat <em>under-spread</em> — the model separates
                  patients in the right order but compresses them toward the average more than the data
                  warrant. Out-of-bag absolute calibration error at 5 years is 0.68 percentage points on
                  average (ICI) and 1.24 percentage points at the 90th percentile (E90).
                </p>
                <p>
                  Overall accuracy at 5 years: integrated Brier score 0.0049 for the model against 0.0054 for
                  a Kaplan–Meier reference that ignores all covariates; integrated index of prediction
                  accuracy 8.8% apparent, 3.9% out-of-bag (interval −3.8% to 10.6%). With 27 events, the
                  headroom over a covariate-free baseline in absolute-error terms is genuinely small even
                  though the ranking is good. That gap between strong discrimination and modest Brier gain is
                  the honest summary of this model: it orders patients well, and it cannot pin down any one
                  patient&apos;s absolute risk precisely.
                </p>
              </Section>

              <Section
                title="7. Risk zones and how the thresholds were derived"
                subtitle="three boundaries, four zones"
              >
                <p>
                  A continuous risk is hard to act on, so the calculator also places each patient in one of
                  four zones, using three threshold curves defined on every day of the 5-year window. Two
                  design targets were declared <em>before</em> the rule was chosen, so it could be judged
                  rather than tuned to look good:
                </p>
                <ul className="list-disc space-y-1 pl-5">
                  <li>
                    <strong>Flag burden ≤ 15%</strong> — at most 15% of the cohort should ever enter the
                    high-risk zone.
                  </li>
                  <li>
                    <strong>Event capture ≥ 75%</strong> — at least 75% of the patients who actually recurred
                    within 5 years should have been in the high-risk zone at or before their recurrence.
                  </li>
                </ul>
                <p>Each boundary is derived by its own rule:</p>
                <ul className="list-disc space-y-2 pl-5">
                  <li>
                    <strong>High boundary (t_high) — top-q cohort rule.</strong> All patients are ranked by
                    predicted five-year risk and the <strong>top 15%</strong> are designated high risk;
                    membership is fixed from day 0 rather than re-evaluated each day. The cutoff is a
                    predicted 5-year risk of <strong>2.392%</strong>. Because 13 patients sit exactly on the
                    cutoff, 491 patients (15.21%) end up flagged rather than exactly 15%. q was set to the
                    declared flag-burden target itself, not tuned against event capture.
                  </li>
                  <li>
                    <strong>Intermediate boundary (t_intermediate) — mean risk.</strong> The cohort mean of
                    predicted risk on each day, read directly off the risk matrix with no smoothing.
                  </li>
                  <li>
                    <strong>Low boundary (t_low) — bottom-q gap rule.</strong> All nine retained variables
                    are binary, so predicted risk takes only <strong>213 distinct values</strong> across
                    3,228 patients and the low end of the distribution is a handful of very large tied
                    blocks. The rule therefore takes whole tied blocks up to a 35th-percentile target — which
                    lands on the block boundary at 38.01% of the cohort, 1,227 patients — and places the cut
                    inside the <em>gap</em> above them, at the geometric midpoint between the two bracketing
                    risk values (a gap 12.18% wide, between 0.300% and 0.337% five-year risk). No patient
                    sits on the boundary, so a refit cannot reassign hundreds of patients on floating-point
                    noise.
                  </li>
                </ul>
                <p>
                  None of the three curves is smoothed, splined or shrunk on the deployed path. Deployed
                  boundary values, expressed as predicted absolute risk:
                </p>
                <Table>
                  <thead>
                    <tr>
                      <Th>Horizon</Th>
                      <Th className="text-right">t_low</Th>
                      <Th className="text-right">t_intermediate</Th>
                      <Th className="text-right">t_high</Th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <Td>1 year</Td>
                      <Td className="text-right">0.037%</Td>
                      <Td className="text-right">0.159%</Td>
                      <Td className="text-right">0.283%</Td>
                    </tr>
                    <tr>
                      <Td>3 years</Td>
                      <Td className="text-right">0.146%</Td>
                      <Td className="text-right">0.616%</Td>
                      <Td className="text-right">1.108%</Td>
                    </tr>
                    <tr>
                      <Td>5 years</Td>
                      <Td className="text-right">0.318%</Td>
                      <Td className="text-right">1.316%</Td>
                      <Td className="text-right">2.392%</Td>
                    </tr>
                  </tbody>
                </Table>
                <p className="pt-1">
                  <strong>What the zones contain</strong>, with observed cumulative incidence at 5 years in
                  the fitting cohort:
                </p>
                <Table>
                  <thead>
                    <tr>
                      <Th>Zone</Th>
                      <Th className="text-right">Patients</Th>
                      <Th className="text-right">Events</Th>
                      <Th className="text-right">Observed 5-y incidence (95% CI)</Th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <Td>Low</Td>
                      <Td className="text-right">1,227 (38.0%)</Td>
                      <Td className="text-right">1</Td>
                      <Td className="text-right">0.24% (0.03–1.66)</Td>
                    </tr>
                    <tr>
                      <Td>Mid-low</Td>
                      <Td className="text-right">1,234 (38.2%)</Td>
                      <Td className="text-right">3</Td>
                      <Td className="text-right">0.55% (0.17–1.73)</Td>
                    </tr>
                    <tr>
                      <Td>Mid-high</Td>
                      <Td className="text-right">276 (8.6%)</Td>
                      <Td className="text-right">2</Td>
                      <Td className="text-right">1.19% (0.30–4.68)</Td>
                    </tr>
                    <tr>
                      <Td>High</Td>
                      <Td className="text-right">491 (15.2%)</Td>
                      <Td className="text-right">21</Td>
                      <Td className="text-right">5.96% (3.87–9.14)</Td>
                    </tr>
                  </tbody>
                </Table>
                <p className="pt-1">
                  <strong>How the rule holds up out of sample</strong>, measured on out-of-bag patients
                  across 497 bootstrap replicates:
                </p>
                <Table>
                  <thead>
                    <tr>
                      <Th>Criterion</Th>
                      <Th className="text-right">Apparent</Th>
                      <Th className="text-right">Out-of-bag median (95%)</Th>
                      <Th className="text-right">Target</Th>
                      <Th className="text-right">Replicates meeting it</Th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <Td>Flag burden at 5 years</Td>
                      <Td className="text-right">15.2%</Td>
                      <Td className="text-right">15.5% (13.0–19.1)</Td>
                      <Td className="text-right">≤ 15%</Td>
                      <Td className="text-right">36%</Td>
                    </tr>
                    <tr>
                      <Td>Event capture at 5 years</Td>
                      <Td className="text-right">77.8% (21/27)</Td>
                      <Td className="text-right">70.0% (40.0–91.4)</Td>
                      <Td className="text-right">≥ 75%</Td>
                      <Td className="text-right">31%</Td>
                    </tr>
                  </tbody>
                </Table>
                <p>
                  Both targets are met on the fitting cohort and{" "}
                  <strong>missed at the median out of sample</strong>, and only about a third of replicates
                  satisfy each one. This is stated rather than hidden: with 27 events, event capture is a
                  fraction with a denominator in the twenties, and its interval (40%–91%) is correspondingly
                  enormous. The threshold values themselves are more stable than the metrics they produce —
                  the ratio of the out-of-bag boundary to the deployed boundary at 5 years is 0.92 for t_low,
                  1.02 for t_intermediate and 0.90 for t_high.
                </p>
              </Section>

              <Section
                title="8. Other cut-off levels can be used"
                subtitle="the 15% boundary is a policy choice, not an optimum"
              >
                <p>
                  The high-risk boundary encodes a <strong>capacity decision, not a biological fact</strong>.
                  It answers &ldquo;how many patients can we afford to watch closely?&rdquo;, and 15% was
                  chosen because it was the declared design target for this work. A service with different
                  capacity, or a different tolerance for missed recurrences, should choose a different one.
                  Changing the cut-off does not change the model, the coefficients or any individual&apos;s
                  predicted risk — only where the line is drawn on the same ranking.
                </p>
                <p>
                  The table below shows what other choices would have produced on this cohort. Capture is the
                  share of recurrences that were inside the flagged group at or before the recurrence; PPV is
                  the share of flagged patients who recurred within 5 years.
                </p>
                <Table>
                  <thead>
                    <tr>
                      <Th>Top q</Th>
                      <Th className="text-right">5-y risk cutoff</Th>
                      <Th className="text-right">Flagged</Th>
                      <Th className="text-right">Capture 1 y</Th>
                      <Th className="text-right">Capture 3 y</Th>
                      <Th className="text-right">Capture 5 y</Th>
                      <Th className="text-right">5-y PPV</Th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <Td>5%</Td>
                      <Td className="text-right">5.01%</Td>
                      <Td className="text-right">177 (5.5%)</Td>
                      <Td className="text-right">80%</Td>
                      <Td className="text-right">88%</Td>
                      <Td className="text-right">63%</Td>
                      <Td className="text-right">9.6%</Td>
                    </tr>
                    <tr>
                      <Td>10%</Td>
                      <Td className="text-right">3.05%</Td>
                      <Td className="text-right">327 (10.1%)</Td>
                      <Td className="text-right">100%</Td>
                      <Td className="text-right">94%</Td>
                      <Td className="text-right">70%</Td>
                      <Td className="text-right">5.8%</Td>
                    </tr>
                    <tr className="bg-muted/40">
                      <Td className="font-medium text-foreground">15% (deployed)</Td>
                      <Td className="text-right">2.39%</Td>
                      <Td className="text-right">491 (15.2%)</Td>
                      <Td className="text-right">100%</Td>
                      <Td className="text-right">94%</Td>
                      <Td className="text-right">78%</Td>
                      <Td className="text-right">4.3%</Td>
                    </tr>
                    <tr>
                      <Td>20%</Td>
                      <Td className="text-right">1.79%</Td>
                      <Td className="text-right">657 (20.4%)</Td>
                      <Td className="text-right">100%</Td>
                      <Td className="text-right">94%</Td>
                      <Td className="text-right">81%</Td>
                      <Td className="text-right">3.3%</Td>
                    </tr>
                    <tr>
                      <Td>25%</Td>
                      <Td className="text-right">1.12%</Td>
                      <Td className="text-right">834 (25.8%)</Td>
                      <Td className="text-right">100%</Td>
                      <Td className="text-right">94%</Td>
                      <Td className="text-right">85%</Td>
                      <Td className="text-right">2.8%</Td>
                    </tr>
                    <tr>
                      <Td>30%</Td>
                      <Td className="text-right">0.82%</Td>
                      <Td className="text-right">969 (30.0%)</Td>
                      <Td className="text-right">100%</Td>
                      <Td className="text-right">94%</Td>
                      <Td className="text-right">89%</Td>
                      <Td className="text-right">2.5%</Td>
                    </tr>
                  </tbody>
                </Table>
                <p>
                  These are in-sample values. Out of sample, expect capture roughly 8 percentage points
                  lower, which is the optimism measured at the deployed setting. The low boundary is
                  similarly adjustable: it is currently set to a 35th-percentile target that resolves to the
                  38% block boundary, and any other percentile can be substituted through the same gap rule.
                </p>
              </Section>

              <Section
                title="10. Limitations"
                subtitle="read before using any number from this tool"
              >
                <ul className="list-disc space-y-2 pl-5">
                  <li>
                    <strong>Only 27 events.</strong> Everything downstream inherits that. Confidence
                    intervals on the coefficients span factors of two to eight, event capture has an
                    out-of-bag interval from 40% to 91%, and three of the nine retained variables survive the
                    penalty in fewer than 70% of bootstrap replicates.
                  </li>
                  <li>
                    <strong>Single centre, retrospective.</strong> One institution, roughly 22 years of
                    diagnoses, with diagnostic and treatment practice changing across that span. The model
                    has had <strong>no external or temporal validation</strong>; every figure on this page is
                    internal.
                  </li>
                  <li>
                    <strong>Rows are lesions, not patients.</strong> 3,228 records come from 2,971 patients,
                    and the model treats every row as independent. Patients contributing more than one record
                    are slightly over-weighted.
                  </li>
                  <li>
                    <strong>Treatment variables are confounded by indication.</strong> Treatment was assigned
                    by clinicians who already knew each patient&apos;s risk. Coefficients on treatment
                    variables describe the recorded association in this cohort, not the effect of giving or
                    withholding that treatment.
                  </li>
                  <li>
                    <strong>Some retained variables have no plausible direct mechanism</strong> — lesion side
                    is the clearest example. They are proxies for information not otherwise recorded, and
                    their small coefficients should not be interpreted clinically.
                  </li>
                  <li>
                    <strong>No competing risks.</strong> Death and distant metastasis are treated as
                    censoring, which biases regional-recurrence risk upward relative to a competing-risks
                    analysis.
                  </li>
                  <li>
                    <strong>Predicted risk is zero before day 75</strong>, because that is when the first
                    recurrence in the cohort occurred; and predictions stop at 5 years, because follow-up was
                    censored there by design.
                  </li>
                  <li>
                    <strong>Outside the described population the output is undefined.</strong> The model was
                    built on female patients with early breast cancer who had completed treatment, and it
                    predicts regional nodal recurrence only — not local recurrence, distant metastasis or
                    survival.
                  </li>
                  <li>
                    <strong>Research use only.</strong> This calculator is not a medical device, has not been
                    approved by any regulator, and must not be the basis of an individual clinical decision.
                  </li>
                </ul>
              </Section>

              <Section
                title="11. Reproducibility"
                subtitle="what exactly is running behind this page"
              >
                <p>
                  The calculator loads a single serialised model bundle, produced by one notebook that is the
                  sole source of truth for the deployed system. That bundle contains the fitted Cox model,
                  the min–max scaler fitted on the full cohort, the exact feature list and column order, the
                  full daily threshold table, the high- and low-zone cutoffs, the coefficient table and the
                  run metadata — so the risk this page shows is computed by the same objects that were
                  validated, not by a reimplementation.
                </p>
                <p>
                  Deployed bundle generated 24 August 2026, with Python 3.11.13, scikit-survival 0.25.0,
                  scikit-learn 1.7.2, NumPy 2.3.1, SciPy 1.16.2 and pandas 2.3.2. Random seeds are fixed
                  throughout, so a rerun reproduces the deployed thresholds exactly; the shipped threshold
                  table was checked cell by cell against the zones derived in session and reproduces them on
                  every day the model separates any patient.
                </p>
              </Section>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
};

export default Landing;
