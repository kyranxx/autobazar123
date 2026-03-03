import { useTranslations } from "next-intl";
import { CheckIcon } from "@/components/ui/Icons";

interface WizardProgressProps {
  currentStep: number;
  steps: { id: number; nameKey: string; icon: string }[];
  onStepClick: (id: number) => void;
}

function StepIcon({ stepId }: { stepId: number }) {
  const glyphMap: Record<number, string> = {
    1: "KAT",
    2: "VOZ",
    3: "TECH",
    4: "INFO",
    5: "FOTO",
  };

  return <span className="text-[10px] font-bold">{glyphMap[stepId] || "KROK"}</span>;
}

export function WizardProgress({
  currentStep,
  steps,
  onStepClick,
}: WizardProgressProps) {
  const t = useTranslations("addListing");

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between gap-1">
        {steps.map((step, index) => (
          <div key={step.id} className="flex flex-1 flex-col items-center">
            <div className="relative flex w-full items-center">
              {index > 0 && (
                <div
                  className={`absolute left-0 right-1/2 h-0.5 ${
                    currentStep > step.id ? "bg-accent" : "bg-border"
                  }`}
                />
              )}
              {index < steps.length - 1 && (
                <div
                  className={`absolute left-1/2 right-0 h-0.5 ${
                    currentStep > step.id ? "bg-accent" : "bg-border"
                  }`}
                />
              )}

              <button
                type="button"
                onClick={() => {
                  if (step.id < currentStep) onStepClick(step.id);
                }}
                disabled={step.id > currentStep}
                className={`relative z-10 mx-auto flex h-10 w-10 items-center justify-center rounded-full transition-all ${
                  currentStep === step.id
                    ? "scale-110 bg-accent text-white shadow-lg"
                    : currentStep > step.id
                      ? "cursor-pointer bg-accent text-white hover:scale-105"
                      : "bg-surface text-secondary"
                }`}
              >
                {currentStep > step.id ? (
                  <CheckIcon className="h-5 w-5" />
                ) : (
                  <StepIcon stepId={step.id} />
                )}
              </button>
            </div>
            <span
              className={`mt-2 hidden text-xs font-medium sm:block ${
                currentStep >= step.id ? "text-primary" : "text-secondary"
              }`}
            >
              {t(step.nameKey)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
