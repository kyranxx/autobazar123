import Image from "next/image";
import { cn } from "@/utils/cn";

type BrandLogoProps = {
  marketCode: "SK" | "RO";
  className?: string;
  imageClassName?: string;
  inverse?: boolean;
  responsiveInverse?: boolean;
  showDomain?: boolean;
};

export function BrandLogo({
  marketCode,
  className,
  imageClassName,
  inverse = false,
  responsiveInverse = false,
  showDomain = false,
}: BrandLogoProps) {
  if (marketCode === "SK") {
    return (
      <span className={cn("font-display font-semibold tracking-tight", className)}>
        Autobazar
        <span className="text-[var(--color-accent)]">123</span>
        {showDomain ? ".sk" : null}
      </span>
    );
  }

  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      <Image
        src="/brand/autoninja/mascot-head.png"
        alt=""
        width={48}
        height={48}
        sizes="48px"
        className={cn("size-[1.45em] shrink-0 object-contain", imageClassName)}
      />
      <span className="font-sans font-black tracking-[-0.055em]">
        <span
          className={cn(
            responsiveInverse
              ? "text-white md:text-text-primary"
              : inverse
                ? "text-white"
                : "text-text-primary",
          )}
        >
          Auto
        </span>
        <span className="text-[var(--color-accent)]">Ninja</span>
        {showDomain ? (
          <span className={cn("tracking-normal", inverse ? "text-white" : "text-text-primary")}>
            .ro
          </span>
        ) : null}
      </span>
    </span>
  );
}
