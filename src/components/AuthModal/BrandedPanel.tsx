
import React from "react";
import { CheckCircle2 } from "lucide-react";
import { BRAND_VISUAL_CONFIG } from "@/config/config";
/* ─── Branded side panel (desktop) ─── */

function BrandedPanel({ t }: { t: (key: string) => string }) {
  return (
    <div
      className="hidden md:flex flex-col justify-between p-8 text-white relative overflow-hidden"
      style={{
        background: `linear-gradient(135deg, var(--color-primary) 0%, ${BRAND_VISUAL_CONFIG.authPanelGradientEnd} 100%)`,
        minHeight: 420,
      }}
    >
      {/* Decorative circle — top-right only */}
      <div
        className="absolute -top-16 -right-16 w-48 h-48 rounded-full opacity-10"
        style={{ background: "var(--color-mint)" }}
      />

      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-8">
          <span className="text-2xl font-display font-bold tracking-tight">
            Autobazar<span className="text-[var(--color-accent)]">123</span>
          </span>
        </div>

        <h3 className="text-xl font-semibold leading-snug mb-3 whitespace-pre-line">
          {t("brand.title")}
        </h3>
        <p className="text-sm leading-relaxed" style={{ color: "var(--color-mint)" }}>
          {t("brand.subtitle")}
        </p>
      </div>

      <div className="relative z-10 space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: BRAND_VISUAL_CONFIG.authPanelFeatureGlow }}>
            <CheckCircle2 className="w-4 h-4 text-white" />
          </div>
          <span className="text-sm" style={{ color: "var(--color-mint)" }}>{t("brand.feature1")}</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: BRAND_VISUAL_CONFIG.authPanelFeatureGlow }}>
            <CheckCircle2 className="w-4 h-4 text-white" />
          </div>
          <span className="text-sm" style={{ color: "var(--color-mint)" }}>{t("brand.feature2")}</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: BRAND_VISUAL_CONFIG.authPanelFeatureGlow }}>
            <CheckCircle2 className="w-4 h-4 text-white" />
          </div>
          <span className="text-sm" style={{ color: "var(--color-mint)" }}>{t("brand.feature3")}</span>
        </div>
      </div>
    </div>
  );
}

/* ─── Branded strip (mobile) ─── */

function MobileBrandStrip({ t }: { t: (key: string) => string }) {
  return (
    <div
      className="md:hidden relative overflow-hidden text-white"
      style={{
        background: `linear-gradient(135deg, var(--color-primary) 0%, ${BRAND_VISUAL_CONFIG.authPanelGradientEnd} 100%)`,
      }}
    >
      <div className="relative z-10 px-5 py-4">
        <div className="flex items-center gap-3 mb-2.5">
          <span className="text-lg font-display font-bold tracking-tight">
            Autobazar<span className="text-[var(--color-accent)]">123</span>
          </span>
          <span className="text-xs text-white/60 hidden min-[360px]:inline">·</span>
          <span className="text-xs hidden min-[360px]:inline" style={{ color: "var(--color-mint)" }}>{t("brand.mobileSubtitle")}</span>
        </div>
        <div className="flex items-center gap-4" style={{ color: "var(--color-mint)" }}>
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: BRAND_VISUAL_CONFIG.authPanelFeatureGlow }}>
              <CheckCircle2 className="w-3 h-3 text-white" />
            </div>
            <span className="text-[11px]">{t("brand.mobileFeature1")}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: BRAND_VISUAL_CONFIG.authPanelFeatureGlow }}>
              <CheckCircle2 className="w-3 h-3 text-white" />
            </div>
            <span className="text-[11px]">{t("brand.mobileFeature2")}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: BRAND_VISUAL_CONFIG.authPanelFeatureGlow }}>
              <CheckCircle2 className="w-3 h-3 text-white" />
            </div>
            <span className="text-[11px]">{t("brand.mobileFeature3")}</span>
          </div>
        </div>
      </div>
    </div>
  );
}


export { BrandedPanel, MobileBrandStrip };
