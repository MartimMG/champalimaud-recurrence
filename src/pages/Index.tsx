import { useState, useMemo } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PatientForm from "@/components/PatientForm";
import RiskCurve from "@/components/RiskCurve";
import VariableImportance from "@/components/VariableImportance";
import { computeRisk, DEFAULT_INPUT, type PatientInput } from "@/lib/coxModel";
import { Activity, BarChart3 } from "lucide-react";

const Index = () => {
  const [input, setInput] = useState<PatientInput>(DEFAULT_INPUT);

  const results = useMemo(() => computeRisk(input), [input]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/60 bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-[1920px] mx-auto px-4 sm:px-6 py-3 flex items-center gap-3">
          <img
            src="/logo.png"
            alt="App logo"
            className="h-8 w-8 rounded-lg object-cover"
          />
          <div>
            <h1 className="text-base font-semibold tracking-tight text-foreground">
              Breast Cancer Regional Recurrence Risk Calculator
            </h1>
            <p className="text-xs text-muted-foreground">
              Cox proportional hazards model · Dynamic risk prediction
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-[1920px] mx-auto px-4 sm:px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Clinical variables — scrolls independently so the results stay reachable */}
          <div className="order-1 lg:order-none lg:col-span-3 lg:sticky lg:top-[76px] lg:self-start lg:max-h-[calc(100vh-96px)] lg:overflow-y-auto">
            <PatientForm input={input} onChange={setInput} group="clinical" />
          </div>

          {/* Middle: Results — ordered last on mobile so both variable panels are filled in first */}
          <div className="order-3 lg:order-none lg:col-span-6">
            <Tabs defaultValue="risk" className="w-full">
              <TabsList className="mb-4">
                <TabsTrigger value="risk" className="gap-1.5">
                  <Activity className="h-3.5 w-3.5" />
                  Risk Curve
                </TabsTrigger>
                <TabsTrigger value="importance" className="gap-1.5">
                  <BarChart3 className="h-3.5 w-3.5" />
                  Variable Importance
                </TabsTrigger>
              </TabsList>
              <TabsContent value="risk">
                <RiskCurve
                  survivalCurve={results.survivalCurve}
                  yearlyRisk={results.yearlyRisk}
                />
              </TabsContent>
              <TabsContent value="importance" className="space-y-4">
                <VariableImportance contributions={results.contributions} input={input} />
              </TabsContent>
            </Tabs>
          </div>

          {/* Right: Treatment variables — scrolls independently so the results stay reachable */}
          <div className="order-2 lg:order-none lg:col-span-3 lg:sticky lg:top-[76px] lg:self-start lg:max-h-[calc(100vh-96px)] lg:overflow-y-auto">
            <PatientForm input={input} onChange={setInput} group="treatment" />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
