export async function uploadImageToCloudflare(file: File): Promise<string> {
  // 1. Get Direct Upload URL
  const response = await fetch("/api/images/upload-url", { method: "POST" });

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

  // Return the 'public' variant URL
  // Cloudflare returns variants array. We'll pick the one ending in /public or just the first one if not found.
  const variants = uploadResult.result.variants as string[];
  const publicVariant =
    variants.find((v) => v.endsWith("/public")) || variants[0];

  return publicVariant;
}
