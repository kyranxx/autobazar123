"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";

export default function Footer() {
    const t = useTranslations("footer");
    const tCommon = useTranslations("common");

    const footerLinks = {
        navigation: [
            { href: "/vysledky", label: tCommon("cars") },
            { href: "/predajcovia", label: tCommon("dealers") },
            { href: "/ceny", label: tCommon("pricing") },
            { href: "/kontakt", label: tCommon("contact") },
        ],
        forDealers: [
            { href: "/pridat-inzerat", label: tCommon("addListing") },
            { href: "/kredity", label: tCommon("pricing") },
            { href: "/dealer", label: t("forDealers") },
            { href: "/moj-ucet", label: tCommon("myAccount") },
        ],
        legal: [
            { href: "/o-nas", label: tCommon("about") },
            { href: "/obchodne-podmienky", label: t("termsOfService") },
            { href: "/ochrana-udajov", label: t("privacyPolicy") },
            { href: "/cookies", label: t("cookiePolicy") },
        ],
    };

    return (
        <footer className="bg-[#0f172a] text-white border-t border-white/5 relative overflow-hidden">
            {/* Background pattern */}
            <div className="absolute inset-0 pointer-events-none opacity-20 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] mix-blend-overlay" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent pointer-events-none" />

            <div className="container-main py-12 sm:py-20 relative z-10">
                {/* Main footer content */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-16">
                    {/* Brand column */}
                    <div className="space-y-6">
                        <Link href="/" className="inline-flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-white text-primary flex items-center justify-center text-sm font-bold shadow-glow">
                                AB
                            </div>
                            <span className="text-2xl font-display font-bold text-white tracking-tight">
                                Autobazar<span className="text-accent font-light">123</span>
                            </span>
                        </Link>
                        <p className="text-base text-gray-400 leading-relaxed max-w-xs">
                            {t("description")}
                        </p>
                        <div className="flex items-center gap-3">
                            <SocialLink href="https://facebook.com" icon={<FacebookIcon />} />
                            <SocialLink href="https://instagram.com" icon={<InstagramIcon />} />
                        </div>
                    </div>

                    {/* Navigation links */}
                    <div>
                        <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-6">
                            {t("navigation")}
                        </h3>
                        <ul className="space-y-4">
                            {footerLinks.navigation.map((link) => (
                                <li key={link.href}>
                                    <Link
                                        href={link.href}
                                        className="text-base text-gray-400 hover:text-white hover:translate-x-1 transition-all inline-block"
                                    >
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* For dealers */}
                    <div>
                        <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-6">
                            {t("forDealers")}
                        </h3>
                        <ul className="space-y-4">
                            {footerLinks.forDealers.map((link) => (
                                <li key={link.href}>
                                    <Link
                                        href={link.href}
                                        className="text-base text-gray-400 hover:text-white hover:translate-x-1 transition-all inline-block"
                                    >
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Legal */}
                    <div>
                        <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-6">
                            {t("legal")}
                        </h3>
                        <ul className="space-y-4">
                            {footerLinks.legal.map((link) => (
                                <li key={link.href}>
                                    <Link
                                        href={link.href}
                                        className="text-base text-gray-400 hover:text-white hover:translate-x-1 transition-all inline-block"
                                    >
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Bottom bar */}
                <div className="mt-16 pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-6">
                    <p className="text-sm text-gray-500 text-center sm:text-left">
                        © {new Date().getFullYear()} Autobazar123. All rights reserved.
                    </p>
                    <div className="flex items-center gap-8">
                        <Link href="/ochrana-udajov" className="text-sm text-gray-500 hover:text-white transition-colors">
                            Privacy
                        </Link>
                        <Link href="/cookies" className="text-sm text-gray-500 hover:text-white transition-colors">
                            Cookies
                        </Link>
                        <Link href="/terms" className="text-sm text-gray-500 hover:text-white transition-colors">
                            Terms
                        </Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}

function SocialLink({ href, icon }: { href: string; icon: React.ReactNode }) {
    return (
        <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-accent hover:text-white transition-all shadow-md backdrop-blur-sm"
        >
            {icon}
        </a>
    );
}

function FacebookIcon() {
    return (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M18.77 7.46H14.5v-1.9c0-.9.6-1.1 1-1.1h3V.5h-4.33C10.24.5 9.5 3.44 9.5 5.32v2.15h-3v4h3v12h5v-12h3.85l.42-4z" />
        </svg>
    );
}

function InstagramIcon() {
    return (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
        </svg>
    );
}
