import { useState, useMemo } from "react";
import { formatCurrency } from "@/config/vat"; // Assuming this is where it is, based on CarDetailClient imports
import { CalculatorIcon, ChevronDownIcon } from "@/components/ui/Icons";

export function LeasingCalculator({ price }: { price: number }) {
    const [downPaymentPercent, setDownPaymentPercent] = useState(20);
    const [termMonths, setTermMonths] = useState(48);
    const [interestRate, setInterestRate] = useState(6.9);

    const monthlyPayment = useMemo(() => {
        const principal = price * (1 - downPaymentPercent / 100);
        const monthlyRate = interestRate / 100 / 12;
        const payment =
            (principal * monthlyRate * Math.pow(1 + monthlyRate, termMonths)) /
            (Math.pow(1 + monthlyRate, termMonths) - 1);
        return Math.round(payment);
    }, [price, downPaymentPercent, termMonths, interestRate]);

    const downPaymentAmount = Math.round(price * (downPaymentPercent / 100));

    // Notice we removed the "Leasing Calculator Toggle" wrapper logic because that belongs to the parent container usually,
    // BUT looking at the original code, the component `LeasingCalculator` just renders the content. 
    // The toggle button was OUTSIDE the component in `CarDetailClient`.
    // So this component just renders the calculator form.

    return (
        <div className="rounded-2xl border border-border overflow-hidden animate-fade-in">
            <div className="p-6 space-y-6">
                {/* Down Payment */}
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <label className="text-sm text-secondary">Akontácia</label>
                        <span className="text-sm font-medium text-primary">
                            {downPaymentPercent}% ({formatCurrency(downPaymentAmount)})
                        </span>
                    </div>
                    <input
                        type="range"
                        min={0}
                        max={50}
                        step={5}
                        value={downPaymentPercent}
                        onChange={(e) => setDownPaymentPercent(parseInt(e.target.value))}
                        className="w-full h-2 rounded-full bg-surface appearance-none cursor-pointer accent-accent"
                    />
                </div>

                {/* Term */}
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <label className="text-sm text-secondary">Doba splácania</label>
                        <span className="text-sm font-medium text-primary">
                            {termMonths} mesiacov
                        </span>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                        {[24, 36, 48, 60].map((months) => (
                            <button
                                key={months}
                                onClick={() => setTermMonths(months)}
                                className={`py-2 rounded-lg text-sm font-medium transition-colors ${termMonths === months
                                    ? "bg-accent text-white"
                                    : "bg-surface text-primary hover:bg-surface-hover"
                                    }`}
                            >
                                {months}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Interest Rate */}
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <label className="text-sm text-secondary">Úroková sadzba</label>
                        <span className="text-sm font-medium text-primary">
                            {interestRate}% p.a.
                        </span>
                    </div>
                    <input
                        type="range"
                        min={3}
                        max={15}
                        step={0.1}
                        value={interestRate}
                        onChange={(e) => setInterestRate(parseFloat(e.target.value))}
                        className="w-full h-2 rounded-full bg-surface appearance-none cursor-pointer accent-accent"
                    />
                </div>

                {/* Result */}
                <div className="p-4 rounded-xl bg-accent/10 text-center">
                    <p className="text-sm text-secondary mb-1">Mesačná splátka</p>
                    <p className="text-2xl font-bold text-accent">
                        {formatCurrency(monthlyPayment)}
                    </p>
                </div>

                <p className="text-xs text-tertiary text-center">
                    * Informatívny výpočet. Skutočné podmienky sa môžu líšiť.
                </p>
            </div>
        </div>
    );
}
