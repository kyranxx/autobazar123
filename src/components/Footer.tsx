"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";

export default function Footer() {
    const t = useTranslations("footer");
    const tCommon = useTranslations("common");

    const footerLinks = {
        navigation: [
            { href: "/auta", label: tCommon("cars") },
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
        <footer className="bg-background-secondary border-t border-border">
            <div className="container-main py-12 sm:py-16">
                {/* Main footer content */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 lg:gap-12">
                    {/* Brand column */}
                    <div className="col-span-2 md:col-span-1">
                        <Link href="/" className="inline-block mb-4">
                            <span className="text-lg font-display font-semibold text-text-primary">
                                Autobazar<span className="text-text-muted font-normal">123</span>
                            </span>
                        </Link>
                        <p className="text-sm text-text-tertiary leading-relaxed max-w-xs mb-6">
                            {t("description")}
                        </p>
                        <div className="flex items-center gap-3">
                            <SocialLink href="https://facebook.com" icon={<FacebookIcon />} />
                            <SocialLink href="https://instagram.com" icon={<InstagramIcon />} />
                        </div>
                    </div>

                    {/* Navigation links */}
                    <div>
                        <h3 className="text-xs font-semibold text-text-primary uppercase tracking-wider mb-4">
                            {t("navigation")}
                        </h3>
                        <ul className="space-y-3">
                            {footerLinks.navigation.map((link) => (
                                <li key={link.href}>
                                    <Link 
                                        href={link.href} 
                                        className="text-sm text-text-tertiary hover:text-text-primary transition-colors"
                                    >
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* For dealers */}
                    <div>
                        <h3 className="text-xs font-semibold text-text-primary uppercase tracking-wider mb-4">
                            {t("forDealers")}
                        </h3>
                        <ul className="space-y-3">
                            {footerLinks.forDealers.map((link) => (
                                <li key={link.href}>
                                    <Link 
                                        href={link.href} 
                                        className="text-sm text-text-tertiary hover:text-text-primary transition-colors"
                                    >
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Legal */}
                    <div>
                        <h3 className="text-xs font-semibold text-text-primary uppercase tracking-wider mb-4">
                            {t("legal")}
                        </h3>
                        <ul className="space-y-3">
                            {footerLinks.legal.map((link) => (
                                <li key={link.href}>
                                    <Link 
                                        href={link.href} 
                                        className="text-sm text-text-tertiary hover:text-text-primary transition-colors"
                                    >
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Bottom bar */}
                <div className="mt-12 pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
                    <p className="text-xs text-text-muted text-center sm:text-left">
                        © {new Date().getFullYear()} Autobazar123. Všetky práva vyhradené.
                    </p>
                    <div className="flex items-center gap-6">
                        <Link href="/ochrana-udajov" className="text-xs text-text-muted hover:text-text-secondary transition-colors">
                            Ochrana údajov
                        </Link>
                        <Link href="/cookies" className="text-xs text-text-muted hover:text-text-secondary transition-colors">
                            Cookies
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
            className="w-9 h-9 rounded-md border border-border bg-white flex items-center justify-center text-text-tertiary hover:text-text-primary hover:border-border-strong transition-colors"
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
