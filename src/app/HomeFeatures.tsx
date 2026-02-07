"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { cn } from "@/utils/cn";

export default function HomeFeatures() {
    const tCta = useTranslations("cta");

    const steps = [
        {
            number: "1",
            title: "Vyhľadajte",
            description:
                "Prehliadajte ponuky alebo vyhľadajte presne podľa svojich požiadaviek.",
        },
        {
            number: "2",
            title: "Kontaktujte",
            description:
                "Oslovte predajcu priamo cez platformu a dohodnite si detaily.",
        },
        {
            number: "3",
            title: "Jazdite",
            description:
                "Dohodnite kúpu, vybavte papiere a vyrážajte na cestu.",
        },
    ];

    const trustItems = [
        {
            icon: <ShieldIcon />,
            title: "Overení predajcovia",
            description: "Každý predajca prechádza kontrolou a hodnotením.",
        },
        {
            icon: <CheckIcon />,
            title: "Ochrana kupujúceho",
            description: "Bezpečné platby a jasné pravidlá predaja.",
        },
        {
            icon: <BankIcon />,
            title: "Financovanie",
            description: "Leasing a úver priamo pri výbere auta.",
        },
        {
            icon: <PriceIcon />,
            title: "Transparentné ceny",
            description: "Žiadne skryté poplatky a férové podmienky.",
        },
    ];

    return (
        <>
            {/* How it works — 1-2-3 */}
            <section className="section">
                <div className="container-main">
                    <div className="text-center mb-12">
                        <p className="eyebrow mb-3">Jednoduché ako 1-2-3</p>
                        <h2 className="text-2xl sm:text-3xl md:text-4xl font-display font-semibold text-text-primary mb-4">
                            Ako to funguje
                        </h2>
                        <p className="text-text-secondary max-w-2xl mx-auto">
                            Tri kroky k vášmu novému autu — rýchlo, prehľadne a
                            bez zbytočných komplikácií.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
                        {steps.map((step, index) => (
                            <StepCard
                                key={index}
                                number={step.number}
                                title={step.title}
                                description={step.description}
                                isLast={index === steps.length - 1}
                            />
                        ))}
                    </div>
                </div>
            </section>

            {/* Trust Row */}
            <section className="section section-muted">
                <div className="container-main">
                    <div className="text-center mb-10">
                        <p className="eyebrow mb-3">Dôvera na prvom mieste</p>
                        <h2 className="text-2xl sm:text-3xl md:text-4xl font-display font-semibold text-text-primary mb-4">
                            Bezpečný nákup aj predaj
                        </h2>
                        <p className="text-text-secondary max-w-2xl mx-auto">
                            Overujeme predajcov, chránime kupujúcich a
                            uľahčujeme financovanie.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                        {trustItems.map((item, index) => (
                            <TrustCard
                                key={index}
                                icon={item.icon}
                                title={item.title}
                                description={item.description}
                            />
                        ))}
                    </div>
                </div>
            </section>

            {/* Seller + Dealer CTA */}
            <section className="section section-muted">
                <div className="container-main">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <CtaCard
                            eyebrow="Predať auto"
                            title="Zverejnite inzerát za pár minút"
                            description="Jednoduchý formulár, okamžité zverejnenie a veľký dosah na kupujúcich."
                            primaryHref="/pridat-inzerat"
                            primaryLabel={tCta("addListingFree")}
                            secondaryHref="/ceny"
                            secondaryLabel={tCta("viewPricing")}
                        />
                        <CtaCard
                            eyebrow="Pre predajcov"
                            title="Získajte viac leadov ako dealer"
                            description="Profil predajcu, zvýraznené ponuky a marketingové nástroje pre rast."
                            primaryHref="/dealer"
                            primaryLabel="Stať sa partnerom"
                            secondaryHref="/kontakt"
                            secondaryLabel="Kontaktovať obchod"
                            variant="dark"
                        />
                    </div>
                </div>
            </section>

            {/* Testimonials */}
            <section className="section">
                <div className="container-main">
                    <div className="text-center mb-10">
                        <p className="eyebrow mb-3">Skúsenosti zákazníkov</p>
                        <h2 className="text-2xl sm:text-3xl md:text-4xl font-display font-semibold text-text-primary mb-4">
                            Dôkaz, že to funguje
                        </h2>
                        <p className="text-text-secondary max-w-2xl mx-auto">
                            Skutočné príbehy ľudí, ktorí si u nás našli auto
                            alebo úspešne predali.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <TestimonialCard
                            name="Peter K."
                            location="Bratislava"
                            quote="Rýchle vyhľadávanie a overení predajcov. Auto som našiel do týždňa."
                        />
                        <TestimonialCard
                            name="Lucia M."
                            location="Košice"
                            quote="Inzerát bol online za pár minút a do dvoch dní som mala kupca."
                        />
                        <TestimonialCard
                            name="AutoStar s.r.o."
                            location="Nitra"
                            quote="Ako dealer máme viac kvalitných leadov a lepšiu viditeľnosť ponúk."
                        />
                    </div>
                </div>
            </section>
        </>
    );
}

function StepCard({
    number,
    title,
    description,
    isLast,
}: {
    number: string;
    title: string;
    description: string;
    isLast: boolean;
}) {
    return (
        <div className="relative text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-surface border border-border-subtle mb-6">
                <span className="text-2xl font-display font-bold text-text-primary">
                    {number}
                </span>
            </div>
            <h3 className="text-lg font-display font-semibold text-text-primary mb-2">
                {title}
            </h3>
            <p className="text-sm text-text-tertiary leading-relaxed max-w-xs mx-auto">
                {description}
            </p>
        </div>
    );
}

function TrustCard({
    icon,
    title,
    description,
}: {
    icon: React.ReactNode;
    title: string;
    description: string;
}) {
    return (
        <div className="card card-hover p-6">
            <div className="w-11 h-11 rounded-lg bg-surface border border-border-subtle flex items-center justify-center text-text-primary mb-4">
                {icon}
            </div>
            <h3 className="text-base font-semibold text-text-primary mb-2">
                {title}
            </h3>
            <p className="text-sm text-text-tertiary leading-relaxed">
                {description}
            </p>
        </div>
    );
}

function CtaCard({
    eyebrow,
    title,
    description,
    primaryHref,
    primaryLabel,
    secondaryHref,
    secondaryLabel,
    variant,
}: {
    eyebrow: string;
    title: string;
    description: string;
    primaryHref: string;
    primaryLabel: string;
    secondaryHref: string;
    secondaryLabel: string;
    variant?: "dark";
}) {
    const isDark = variant === "dark";
    return (
        <div
            className={cn(
                isDark
                    ? "relative overflow-hidden rounded-2xl p-8 bg-background-dark text-text-inverse"
                    : "card p-8"
            )}
        >
            {isDark && (
                <>
                    <div className="absolute -top-20 -right-20 w-56 h-56 bg-text-inverse/10 rounded-full blur-3xl" />
                    <div className="absolute -bottom-24 -left-16 w-56 h-56 bg-text-inverse/10 rounded-full blur-3xl" />
                </>
            )}
            <div className="relative">
                <p
                    className={cn(
                        "eyebrow mb-3",
                        isDark && "text-text-muted"
                    )}
                >
                    {eyebrow}
                </p>
                <h3
                    className={cn(
                        "text-2xl font-semibold mb-3",
                        isDark ? "text-text-inverse" : "text-text-primary"
                    )}
                >
                    {title}
                </h3>
                <p
                    className={cn(
                        "mb-6",
                        isDark ? "text-text-muted" : "text-text-tertiary"
                    )}
                >
                    {description}
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                    <Link
                        href={primaryHref}
                        className="btn-primary w-full sm:w-auto"
                    >
                        {primaryLabel}
                    </Link>
                    <Link
                        href={secondaryHref}
                        className={cn(
                            "btn-secondary w-full sm:w-auto",
                            isDark &&
                                "text-text-inverse border-text-inverse/20 bg-text-inverse/10 hover:border-text-inverse/40 hover:bg-text-inverse/20"
                        )}
                    >
                        {secondaryLabel}
                    </Link>
                </div>
            </div>
        </div>
    );
}

function TestimonialCard({
    name,
    location,
    quote,
}: {
    name: string;
    location: string;
    quote: string;
}) {
    return (
        <div className="card card-hover p-6">
            <div className="flex items-center gap-2 text-xs text-text-tertiary mb-3">
                <StarIcon className="w-4 h-4 text-text-tertiary" />
                5.0 hodnotenie
            </div>
            <p className="text-sm text-text-secondary leading-relaxed mb-4">
                &ldquo;{quote}&rdquo;
            </p>
            <p className="text-sm font-semibold text-text-primary">{name}</p>
            <p className="text-xs text-text-tertiary">{location}</p>
        </div>
    );
}

function ShieldIcon() {
    return (
        <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
            />
        </svg>
    );
}

function CheckIcon() {
    return (
        <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M5 13l4 4L19 7"
            />
        </svg>
    );
}

function BankIcon() {
    return (
        <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M3 9h18M4 9v10m4-10v10m4-10v10m4-10v10m4-10v10M3 19h18M12 5l7 4H5l7-4z"
            />
        </svg>
    );
}

function StarIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.955a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.368 2.447a1 1 0 00-.364 1.118l1.287 3.955c.3.921-.755 1.688-1.54 1.118l-3.368-2.447a1 1 0 00-1.175 0l-3.368 2.447c-.784.57-1.838-.197-1.539-1.118l1.286-3.955a1 1 0 00-.364-1.118L2.06 9.382c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.951-.69l1.286-3.955z" />
        </svg>
    );
}

function PriceIcon() {
    return (
        <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z"
            />
        </svg>
    );
}
