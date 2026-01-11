"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import LanguageSwitcher from "@/components/LanguageSwitcher";

export default function Footer() {
    const t = useTranslations("footer");
    const tCommon = useTranslations("common");

    return (
        <footer className="border-t border-border bg-surface">
            <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
                <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
                    {/* Brand */}
                    <div className="col-span-2 md:col-span-1">
                        <Link href="/" className="inline-block">
                            <span className="text-xl font-bold tracking-tight text-primary">
                                Autobazar<span className="text-accent">123</span>
                            </span>
                        </Link>
                        <p className="mt-4 text-sm text-secondary max-w-xs">
                            {t("description")}
                        </p>
                        {/* Language Switcher in Footer */}
                        <div className="mt-4">
                            <LanguageSwitcher />
                        </div>
                    </div>

                    {/* Links - Navigation */}
                    <div>
                        <h3 className="text-sm font-semibold text-primary">{t("navigation")}</h3>
                        <ul className="mt-4 space-y-3">
                            <li>
                                <Link href="/auta" className="text-sm text-secondary hover:text-accent">
                                    {tCommon("cars")}
                                </Link>
                            </li>
                            <li>
                                <Link href="/predajcovia" className="text-sm text-secondary hover:text-accent">
                                    {tCommon("dealers")}
                                </Link>
                            </li>
                            <li>
                                <Link href="/ceny" className="text-sm text-secondary hover:text-accent">
                                    {tCommon("pricing")}
                                </Link>
                            </li>
                            <li>
                                <Link href="/kontakt" className="text-sm text-secondary hover:text-accent">
                                    {tCommon("contact")}
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Links - For Dealers */}
                    <div>
                        <h3 className="text-sm font-semibold text-primary">{t("forDealers")}</h3>
                        <ul className="mt-4 space-y-3">
                            <li>
                                <Link href="/pridat-inzerat" className="text-sm text-secondary hover:text-accent">
                                    {tCommon("addListing")}
                                </Link>
                            </li>
                            <li>
                                <Link href="/kredity" className="text-sm text-secondary hover:text-accent">
                                    {tCommon("pricing")}
                                </Link>
                            </li>
                            <li>
                                <Link href="/dealer" className="text-sm text-secondary hover:text-accent">
                                    {t("forDealers")}
                                </Link>
                            </li>
                            <li>
                                <Link href="/moj-ucet" className="text-sm text-secondary hover:text-accent">
                                    {tCommon("myAccount")}
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Links - Legal */}
                    <div>
                        <h3 className="text-sm font-semibold text-primary">{t("legal")}</h3>
                        <ul className="mt-4 space-y-3">
                            <li>
                                <Link href="/o-nas" className="text-sm text-secondary hover:text-accent">
                                    {tCommon("about")}
                                </Link>
                            </li>
                            <li>
                                <Link href="/obchodne-podmienky" className="text-sm text-secondary hover:text-accent">
                                    {t("termsOfService")}
                                </Link>
                            </li>
                            <li>
                                <Link href="/ochrana-udajov" className="text-sm text-secondary hover:text-accent">
                                    {t("privacyPolicy")}
                                </Link>
                            </li>
                            <li>
                                <Link href="/cookies" className="text-sm text-secondary hover:text-accent">
                                    {t("cookiePolicy")}
                                </Link>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Bottom */}
                <div className="mt-8 pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
                    <p className="text-xs text-tertiary">
                        {t("copyright", { year: new Date().getFullYear() })}
                    </p>
                    <div className="flex items-center gap-6">
                        <SocialLinks />
                    </div>
                </div>
            </div>
        </footer>
    );
}

function SocialLinks() {
    return (
        <div className="flex items-center gap-3">
            <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center w-8 h-8 rounded-full bg-background border border-border hover:border-accent/30 hover:text-accent transition-colors"
                aria-label="Facebook"
            >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.77 7.46H14.5v-1.9c0-.9.6-1.1 1-1.1h3V.5h-4.33C10.24.5 9.5 3.44 9.5 5.32v2.15h-3v4h3v12h5v-12h3.85l.42-4z" />
                </svg>
            </a>
            <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center w-8 h-8 rounded-full bg-background border border-border hover:border-accent/30 hover:text-accent transition-colors"
                aria-label="Instagram"
            >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                </svg>
            </a>
        </div>
    );
}

