import { useTranslations } from "next-intl";
import { CheckIcon } from "@/components/ui/Icons";

interface WizardProgressProps {
  currentStep: number;
  steps: { id: number; nameKey: string; icon: string }[];
  onStepClick: (id: number) => void;
}

export function WizardProgress({
  currentStep,
  steps,
  onStepClick,
}: WizardProgressProps) {
  const t = useTranslations("addListing");

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <div key={step.id} className="flex flex-col items-center flex-1">
            <div className="relative flex items-center w-full">
              {/* Line before */}
              {index > 0 && (
                <div
                  className={`absolute left-0 right-1/2 h-0.5 ${
                    currentStep > step.id ? "bg-accent" : "bg-border"
                  }`}
                />
              )}
              {/* Line after */}
              {index < steps.length - 1 && (
                <div
                  className={`absolute left-1/2 right-0 h-0.5 ${
                    currentStep > step.id ? "bg-accent" : "bg-border"
                  }`}
                />
              )}
              {/* Circle */}
              <button
                onClick={() => {
                  if (step.id < currentStep) onStepClick(step.id);
                }}
                disabled={step.id > currentStep}
                className={`relative z-10 mx-auto w-10 h-10 rounded-full flex items-center justify-center text-lg transition-all ${
                  currentStep === step.id
                    ? "bg-accent text-white shadow-lg scale-110"
                    : currentStep > step.id
                      ? "bg-accent text-white cursor-pointer hover:scale-105"
                      : "bg-surface text-secondary"
                }`}
              >
                {currentStep > step.id ? (
                  <CheckIcon className="w-5 h-5" />
                ) : (
                  step.icon
                )}
              </button>
            </div>
            <span
              className={`mt-2 text-xs font-medium hidden sm:block ${
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
