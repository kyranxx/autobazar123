"use client";

import { useState } from "react";
import { BreadcrumbTrail } from "@/components/BreadcrumbTrail";
import {
  MarketplaceCard,
  MarketplaceContainer,
  MarketplaceHero,
  MarketplacePageShell,
  MarketplaceSection,
} from "@/components/ui/MarketplacePage";
import type { BreadcrumbTrailItem } from "@/lib/seo/breadcrumbs";

function formatEuros(value: number): string {
  const rounded = Math.round(value);
  return rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

export default function LeasingCalculatorPage({
  breadcrumbItems,
}: {
  breadcrumbItems: BreadcrumbTrailItem[];
}) {
  const [price, setPrice] = useState(25000);
  const [downPayment, setDownPayment] = useState(20);
  const [term, setTerm] = useState(48);
  const [interestRate, setInterestRate] = useState(5.9);

  const downPaymentAmount = (price * downPayment) / 100;
  const loanAmount = price - downPaymentAmount;
  const monthlyRate = interestRate / 100 / 12;
  const monthlyPayment =
    (loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, term))) /
    (Math.pow(1 + monthlyRate, term) - 1);
  const totalPayment = monthlyPayment * term + downPaymentAmount;
  const totalInterest = totalPayment - price;

  return (
    <MarketplacePageShell>
      <MarketplaceContainer size="lg" className="space-y-8">
        <MarketplaceHero
          align="center"
          eyebrow="Financovanie"
          title="Kalkulačka leasingu"
          description="Spočítajte si orientačnú mesačnú splátku za vaše vysnívané auto."
          breadcrumbs={<BreadcrumbTrail items={breadcrumbItems} />}
        />

        <MarketplaceSection>
          <MarketplaceCard className="mx-auto max-w-3xl p-6 sm:p-8">
            <div className="space-y-8">
              <RangeControl
                id="leasing-price"
                label="Cena vozidla"
                value={`${formatEuros(price)} EUR`}
                minLabel="5 000 EUR"
                maxLabel="100 000 EUR"
                inputProps={{
                  min: 5000,
                  max: 100000,
                  step: 1000,
                  value: price,
                  onChange: (value) => setPrice(value),
                }}
              />

              <RangeControl
                id="leasing-down-payment"
                label="Akontácia"
                value={`${downPayment}% (${formatEuros(downPaymentAmount)} EUR)`}
                minLabel="0%"
                maxLabel="50%"
                inputProps={{
                  min: 0,
                  max: 50,
                  step: 5,
                  value: downPayment,
                  onChange: (value) => setDownPayment(value),
                }}
              />

              <RangeControl
                id="leasing-term"
                label="Doba splácania"
                value={`${term} mesiacov`}
                minLabel="12 mes."
                maxLabel="84 mes."
                inputProps={{
                  min: 12,
                  max: 84,
                  step: 12,
                  value: term,
                  onChange: (value) => setTerm(value),
                }}
              />

              <RangeControl
                id="leasing-interest-rate"
                label="Úroková sadzba"
                value={`${interestRate}% p.a.`}
                minLabel="2%"
                maxLabel="15%"
                inputProps={{
                  min: 2,
                  max: 15,
                  step: 0.1,
                  value: interestRate,
                  onChange: (value) => setInterestRate(value),
                }}
              />
            </div>

            <div className="mt-8 border-t border-border pt-8">
              <div className="text-center">
                <p className="text-sm text-secondary">Mesačná splátka</p>
                <p className="mt-2 text-4xl font-bold text-accent">
                  {formatEuros(monthlyPayment)} EUR
                </p>
              </div>

              <div className="mt-6 grid gap-3 text-center sm:grid-cols-3">
                <ResultMetric label="Akontácia" value={`${formatEuros(downPaymentAmount)} EUR`} />
                <ResultMetric label="Celkom zaplatíte" value={`${formatEuros(totalPayment)} EUR`} />
                <ResultMetric
                  label="Úroky"
                  value={`${formatEuros(totalInterest)} EUR`}
                  tone="error"
                />
              </div>
            </div>

            <p className="mt-6 text-center text-xs text-tertiary">
              Informatívny výpočet. Skutočná splátka závisí od podmienok
              financujúcej spoločnosti.
            </p>
          </MarketplaceCard>
        </MarketplaceSection>
      </MarketplaceContainer>
    </MarketplacePageShell>
  );
}

function RangeControl({
  id,
  label,
  value,
  minLabel,
  maxLabel,
  inputProps,
}: {
  id: string;
  label: string;
  value: string;
  minLabel: string;
  maxLabel: string;
  inputProps: {
    min: number;
    max: number;
    step: number;
    value: number;
    onChange: (value: number) => void;
  };
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-3 flex justify-between gap-4 text-sm font-medium text-primary"
      >
        <span>{label}</span>
        <span className="text-right text-accent">{value}</span>
      </label>
      <input
        id={id}
        type="range"
        min={inputProps.min}
        max={inputProps.max}
        step={inputProps.step}
        value={inputProps.value}
        onChange={(e) => inputProps.onChange(Number(e.target.value))}
        className="w-full accent-accent"
      />
      <div className="mt-1 flex justify-between text-xs text-tertiary">
        <span>{minLabel}</span>
        <span>{maxLabel}</span>
      </div>
    </div>
  );
}

function ResultMetric({
  label,
  value,
  tone = "primary",
}: {
  label: string;
  value: string;
  tone?: "primary" | "error";
}) {
  return (
    <div className="rounded-lg border border-border bg-background px-3 py-4">
      <p className="text-sm text-secondary">{label}</p>
      <p className={`font-bold ${tone === "error" ? "text-error" : "text-primary"}`}>{value}</p>
    </div>
  );
}
