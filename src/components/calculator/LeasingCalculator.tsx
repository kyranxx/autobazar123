import { useId, useMemo, useState } from "react";
import { formatCurrency } from "@/config/vat";

export function LeasingCalculator({ price }: { price: number }) {
  const [downPaymentPercent, setDownPaymentPercent] = useState(20);
  const [termMonths, setTermMonths] = useState(48);
  const [interestRate, setInterestRate] = useState(6.9);

  const downPaymentInputId = useId();
  const termMonthsGroupId = useId();
  const interestRateInputId = useId();

  const monthlyPayment = useMemo(() => {
    const principal = price * (1 - downPaymentPercent / 100);
    const monthlyRate = interestRate / 100 / 12;
    const payment =
      (principal * monthlyRate * Math.pow(1 + monthlyRate, termMonths)) /
      (Math.pow(1 + monthlyRate, termMonths) - 1);
    return Math.round(payment);
  }, [price, downPaymentPercent, termMonths, interestRate]);

  const downPaymentAmount = Math.round(price * (downPaymentPercent / 100));

  return (
    <div className="rounded-2xl border border-border overflow-hidden animate-fade-in">
      <div className="p-6 space-y-6">
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm text-secondary" htmlFor={downPaymentInputId}>
              Akontacia
            </label>
            <span className="text-sm font-medium text-primary">
              {downPaymentPercent}% ({formatCurrency(downPaymentAmount)})
            </span>
          </div>
          <input
            id={downPaymentInputId}
            type="range"
            min={0}
            max={50}
            step={5}
            value={downPaymentPercent}
            onChange={(e) => setDownPaymentPercent(parseInt(e.target.value, 10))}
            className="w-full h-2 rounded-full bg-surface appearance-none cursor-pointer accent-accent"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-secondary" id={termMonthsGroupId}>
              Doba splacania
            </span>
            <span className="text-sm font-medium text-primary">
              {termMonths} mesiacov
            </span>
          </div>
          <div
            className="grid grid-cols-4 gap-2"
            role="radiogroup"
            aria-labelledby={termMonthsGroupId}
          >
            {[24, 36, 48, 60].map((months) => (
              <button
                key={months}
                type="button"
                role="radio"
                aria-checked={termMonths === months}
                onClick={() => setTermMonths(months)}
                className={`py-2 rounded-lg text-sm font-medium transition-colors ${
                  termMonths === months
                    ? "bg-accent text-white"
                    : "bg-surface text-primary hover:bg-surface-hover"
                }`}
              >
                {months}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm text-secondary" htmlFor={interestRateInputId}>
              Urokova sadzba
            </label>
            <span className="text-sm font-medium text-primary">
              {interestRate}% p.a.
            </span>
          </div>
          <input
            id={interestRateInputId}
            type="range"
            min={3}
            max={15}
            step={0.1}
            value={interestRate}
            onChange={(e) => setInterestRate(parseFloat(e.target.value))}
            className="w-full h-2 rounded-full bg-surface appearance-none cursor-pointer accent-accent"
          />
        </div>

        <div className="p-4 rounded-xl bg-accent/10 text-center">
          <p className="text-sm text-secondary mb-1">Mesacna splatka</p>
          <p className="text-2xl font-bold text-accent">
            {formatCurrency(monthlyPayment)}
          </p>
        </div>

        <p className="text-xs text-tertiary text-center">
          * Informativny vypocet. Skutocne podmienky sa mozu lisit.
        </p>
      </div>
    </div>
  );
}
