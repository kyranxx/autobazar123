"use client";

import { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function LeasingCalculatorPage() {
    const [price, setPrice] = useState(25000);
    const [downPayment, setDownPayment] = useState(20);
    const [term, setTerm] = useState(48);
    const [interestRate, setInterestRate] = useState(5.9);

    const downPaymentAmount = (price * downPayment) / 100;
    const loanAmount = price - downPaymentAmount;
    const monthlyRate = interestRate / 100 / 12;
    const monthlyPayment = loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, term)) / (Math.pow(1 + monthlyRate, term) - 1);
    const totalPayment = monthlyPayment * term + downPaymentAmount;
    const totalInterest = totalPayment - price;

    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <main className="pt-20 pb-16">
                <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="py-12 text-center">
                        <h1 className="text-3xl font-bold text-primary sm:text-4xl">
                            Kalkulačka leasingu
                        </h1>
                        <p className="mt-4 text-lg text-secondary">
                            Spočítajte si mesačnú splátku za vaše vysnívanené auto
                        </p>
                    </div>

                    {/* Calculator */}
                    <div className="rounded-2xl border border-border p-8 bg-background">
                        {/* Price */}
                        <div className="mb-8">
                            <label className="flex justify-between text-sm font-medium text-primary mb-3">
                                <span>Cena vozidla</span>
                                <span className="text-accent">{price.toLocaleString()} €</span>
                            </label>
                            <input
                                type="range"
                                min="5000"
                                max="100000"
                                step="1000"
                                value={price}
                                onChange={(e) => setPrice(Number(e.target.value))}
                                className="w-full accent-accent"
                            />
                            <div className="flex justify-between text-xs text-tertiary mt-1">
                                <span>5 000 €</span>
                                <span>100 000 €</span>
                            </div>
                        </div>

                        {/* Down Payment */}
                        <div className="mb-8">
                            <label className="flex justify-between text-sm font-medium text-primary mb-3">
                                <span>Akontácia</span>
                                <span className="text-accent">{downPayment}% ({downPaymentAmount.toLocaleString()} €)</span>
                            </label>
                            <input
                                type="range"
                                min="0"
                                max="50"
                                step="5"
                                value={downPayment}
                                onChange={(e) => setDownPayment(Number(e.target.value))}
                                className="w-full accent-accent"
                            />
                            <div className="flex justify-between text-xs text-tertiary mt-1">
                                <span>0%</span>
                                <span>50%</span>
                            </div>
                        </div>

                        {/* Term */}
                        <div className="mb-8">
                            <label className="flex justify-between text-sm font-medium text-primary mb-3">
                                <span>Doba splácania</span>
                                <span className="text-accent">{term} mesiacov</span>
                            </label>
                            <input
                                type="range"
                                min="12"
                                max="84"
                                step="12"
                                value={term}
                                onChange={(e) => setTerm(Number(e.target.value))}
                                className="w-full accent-accent"
                            />
                            <div className="flex justify-between text-xs text-tertiary mt-1">
                                <span>12 mes.</span>
                                <span>84 mes.</span>
                            </div>
                        </div>

                        {/* Interest Rate */}
                        <div className="mb-8">
                            <label className="flex justify-between text-sm font-medium text-primary mb-3">
                                <span>Úroková sadzba</span>
                                <span className="text-accent">{interestRate}% p.a.</span>
                            </label>
                            <input
                                type="range"
                                min="2"
                                max="15"
                                step="0.1"
                                value={interestRate}
                                onChange={(e) => setInterestRate(Number(e.target.value))}
                                className="w-full accent-accent"
                            />
                            <div className="flex justify-between text-xs text-tertiary mt-1">
                                <span>2%</span>
                                <span>15%</span>
                            </div>
                        </div>

                        {/* Results */}
                        <div className="border-t border-border pt-8">
                            <div className="text-center mb-6">
                                <p className="text-sm text-secondary">Mesačná splátka</p>
                                <p className="text-4xl font-bold text-accent">
                                    {monthlyPayment.toLocaleString("sk-SK", { maximumFractionDigits: 0 })} €
                                </p>
                            </div>

                            <div className="grid grid-cols-3 gap-4 text-center">
                                <div className="p-4 rounded-xl bg-surface">
                                    <p className="text-sm text-secondary">Akontácia</p>
                                    <p className="font-bold text-primary">{downPaymentAmount.toLocaleString()} €</p>
                                </div>
                                <div className="p-4 rounded-xl bg-surface">
                                    <p className="text-sm text-secondary">Celkom zaplatíte</p>
                                    <p className="font-bold text-primary">{totalPayment.toLocaleString("sk-SK", { maximumFractionDigits: 0 })} €</p>
                                </div>
                                <div className="p-4 rounded-xl bg-surface">
                                    <p className="text-sm text-secondary">Úroky</p>
                                    <p className="font-bold text-error">{totalInterest.toLocaleString("sk-SK", { maximumFractionDigits: 0 })} €</p>
                                </div>
                            </div>
                        </div>

                        {/* Disclaimer */}
                        <p className="mt-6 text-xs text-tertiary text-center">
                            * Informatívny výpočet. Skutočná splátka závisí od podmienok financujúcej spoločnosti.
                        </p>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}
