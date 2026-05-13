import { ImageResponse } from "next/og";
import type { CSSProperties } from "react";
import { BRAND_THEME } from "@/lib/theme/brand";

// Image metadata
export const size = {
  width: 32,
  height: 32,
};
export const contentType = "image/png";

const iconStyle: CSSProperties = {
  alignItems: "center",
  background: BRAND_THEME.primary,
  borderRadius: 6,
  color: BRAND_THEME.primaryForeground,
  display: "flex",
  fontSize: 18,
  fontWeight: "bold",
  height: "100%",
  justifyContent: "center",
  width: "100%",
};

// Image generation
export default function Icon() {
  return new ImageResponse(
    <div style={iconStyle}>
      AB
    </div>,
    {
      ...size,
    },
  );
}
