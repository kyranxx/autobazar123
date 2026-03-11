import { ImageResponse } from "next/og";
import { BRAND_THEME } from "@/lib/theme/brand";

// Image metadata
export const size = {
  width: 32,
  height: 32,
};
export const contentType = "image/png";

// Image generation
export default function Icon() {
  return new ImageResponse(
    <div
      style={{
        fontSize: 18,
        background: BRAND_THEME.primary,
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: BRAND_THEME.primaryForeground,
        fontWeight: "bold",
        borderRadius: 6,
      }}
    >
      AB
    </div>,
    {
      ...size,
    },
  );
}
