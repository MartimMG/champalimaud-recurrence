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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
            <Activity className="h-4 w-4 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-base font-semibold tracking-tight text-foreground">
              Breast Cancer Recurrence Risk Assessment
            </h1>
            <p className="text-xs text-muted-foreground">
              Cox proportional hazards model · Dynamic risk prediction
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Patient form */}
          <div className="lg:col-span-4">
            <PatientForm input={input} onChange={setInput} />
          </div>

          {/* Right: Results */}
          <div className="lg:col-span-8">
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
              <TabsContent value="importance">
                <VariableImportance contributions={results.contributions} />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
