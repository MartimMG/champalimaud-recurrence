import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const Landing = () => {
  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto flex min-h-screen w-full max-w-5xl items-center px-4 py-10 sm:px-6">
        <Card className="w-full border-border/60 shadow-md">
          <CardContent className="space-y-6 p-6 sm:p-8">
            <div className="flex items-center gap-3">
              <img src="/logo.png" alt="App logo" className="h-10 w-10 rounded-lg object-cover" />
              <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
                Breast Cancer Regional Recurrence Risk Calculator
              </h1>
            </div>

            <div className="space-y-2">
              <p className="text-sm text-muted-foreground sm:text-base">
                The Breast Cancer Regional Recurrence Risk Calculator is an interactive tool designed to estimate the risk
                of regional recurrence of breast cancer patients after undergoing treatment. This tool was developed to be used only for early breast cancer female patients.
              </p>
              <p className="text-sm text-muted-foreground sm:text-base">
                This tool was designed for <strong>research purposes</strong> only. It should be used to assess a
                breast cancer patient&apos;s risk of developing regional recurrence <strong>after undergoing treatment</strong>.
              </p>
              <p className="text-sm text-muted-foreground sm:text-base">
                Some variables may not be directly related with the shown impact, but may have some underlying information that contributes to the risk.
              </p>
            </div>

            <details className="rounded-md border border-border/60 bg-muted/20 px-4 py-3">
              <summary className="cursor-pointer text-sm font-medium text-foreground">About the model</summary>
              <p className="mt-2 text-sm text-muted-foreground">
                This model was developed using a dataset of 3227 breast cancer patients using the BreastCare dataset from Champalimaud Foundation. The model was trained using a Cox proportional hazards model. It uses LASSO regularization to select the most important features.
              </p>
            </details>

            <Button asChild className="gap-2">
              <Link to="/app">
                Go to Risk Calculator
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </main>
  );
};

export default Landing;
