import { validateImageUploadInput } from "@/lib/upload/image-validation";
import { createCsrfHeaders } from "@/lib/security/client-csrf";

export async function uploadImageToCloudflare(file: File): Promise<string> {
  const validation = validateImageUploadInput({
    contentType: file.type,
    fileSize: file.size,
  });

  if (!validation.ok) {
    throw new Error(validation.error);
  }

  // 1. Get Direct Upload URL
  const response = await fetch("/api/images/upload-url", {
    method: "POST",
    headers: createCsrfHeaders(),
  });

  if (!response.ok) {
    throw new Error("Failed to get upload URL");
  }

  const { uploadUrl } = await response.json();

  // 2. Upload to Cloudflare
  const formData = new FormData();
  formData.append("file", file);

  const uploadResponse = await fetch(uploadUrl, {
    method: "POST",
    body: formData,
  });

  const uploadResult = await uploadResponse.json();

  if (!uploadResult.success) {
    throw new Error("Upload failed");
  }

  const variants: string[] = Array.isArray(uploadResult.result?.variants)
    ? (uploadResult.result.variants as unknown[]).filter(
        (variant: unknown): variant is string =>
          typeof variant === "string" && variant.length > 0,
      )
    : [];

  if (variants.length === 0) {
    throw new Error("Upload failed");
  }

  // Keep a stable, high-resolution base URL. Rendering helpers replace the
  // named variant with Cloudflare flexible-variant options for each use case.
  const preferredVariantNames = ["large", "medium", "public", "thumbnail"];
  const preferredVariant = preferredVariantNames
    .map((name) => variants.find((variant) => variant.endsWith(`/${name}`)))
    .find((variant) => variant !== undefined);

  return preferredVariant ?? variants[0];
}
