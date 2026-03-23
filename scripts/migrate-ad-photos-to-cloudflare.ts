import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
const cloudflareAccountId = process.env.CLOUDFLARE_ACCOUNT_ID;
const cloudflareApiToken = process.env.CLOUDFLARE_API_TOKEN;
const requireSignedUrls =
  process.env.CLOUDFLARE_IMAGES_REQUIRE_SIGNED_URLS === "true";

if (!supabaseUrl || !supabaseServiceRole) {
  console.error(
    "Missing env vars. Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY",
  );
  process.exit(1);
}

if (!cloudflareAccountId || !cloudflareApiToken) {
  console.error(
    "Missing env vars. Required: CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_API_TOKEN",
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRole);

type AdRow = {
  id: string;
  status?: string | null;
  photos_json?: unknown;
};

function toPhotoArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(
    (entry): entry is string => typeof entry === "string" && entry.trim().length > 0,
  );
}

function isCloudflareImageUrl(url: string): boolean {
  return url.startsWith("https://imagedelivery.net/");
}

function buildFileName(sourceUrl: string, contentType: string | null): string {
  const parsed = new URL(sourceUrl);
  const rawName = parsed.pathname.split("/").filter(Boolean).at(-1) || "image";
  const sanitized = rawName.replace(/[^a-zA-Z0-9._-]+/g, "-");

  if (sanitized.includes(".")) {
    return sanitized;
  }

  if (contentType === "image/png") {
    return `${sanitized}.png`;
  }

  if (contentType === "image/webp") {
    return `${sanitized}.webp`;
  }

  return `${sanitized}.jpg`;
}

async function uploadSourcePhotoToCloudflare(sourceUrl: string): Promise<string> {
  const sourceResponse = await fetch(sourceUrl, {
    headers: {
      Accept: "image/*",
      "User-Agent": "autobazar123-cloudflare-migrator/1.0",
    },
  });

  if (!sourceResponse.ok) {
    throw new Error(`Source fetch failed with status ${sourceResponse.status}`);
  }

  const contentType = sourceResponse.headers.get("content-type");
  const fileBlob = await sourceResponse.blob();
  const formData = new FormData();
  formData.append(
    "file",
    fileBlob,
    buildFileName(sourceUrl, contentType),
  );
  formData.append("requireSignedURLs", requireSignedUrls ? "true" : "false");
  formData.append(
    "metadata",
    JSON.stringify({
      project: "autobazar123",
      sourceUrl,
      migratedAt: new Date().toISOString(),
    }),
  );

  const uploadResponse = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${cloudflareAccountId}/images/v1`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${cloudflareApiToken}`,
      },
      body: formData,
    },
  );

  const uploadResult = (await uploadResponse.json()) as {
    success?: boolean;
    errors?: Array<{ message?: string }>;
    result?: { variants?: string[] };
  };

  if (!uploadResponse.ok || !uploadResult.success) {
    const errorMessage =
      uploadResult.errors?.[0]?.message || `Cloudflare upload failed with status ${uploadResponse.status}`;
    throw new Error(errorMessage);
  }

  const variants = uploadResult.result?.variants ?? [];
  const publicVariant = variants.find((variant) => variant.endsWith("/public")) || variants[0];

  if (!publicVariant) {
    throw new Error("Cloudflare upload succeeded without a variant URL");
  }

  return publicVariant;
}

async function run(): Promise<void> {
  console.log("Migrating ad photos to Cloudflare Images...");

  const { data: ads, error } = await supabase
    .from("ads")
    .select("id, status, photos_json");

  if (error) {
    throw new Error(`Failed to load ads: ${error.message}`);
  }

  const rows = (ads as AdRow[] | null) ?? [];
  const uniqueSourceUrls = [
    ...new Set(
      rows
        .flatMap((ad) => toPhotoArray(ad.photos_json))
        .filter((url) => !isCloudflareImageUrl(url)),
    ),
  ];

  if (uniqueSourceUrls.length === 0) {
    console.log("No non-Cloudflare photo URLs found.");
    return;
  }

  const uploadedUrlMap = new Map<string, string>();

  for (const sourceUrl of uniqueSourceUrls) {
    const cloudflareUrl = await uploadSourcePhotoToCloudflare(sourceUrl);
    uploadedUrlMap.set(sourceUrl, cloudflareUrl);
    console.log(`Uploaded ${sourceUrl} -> ${cloudflareUrl}`);
  }

  let updatedAds = 0;
  let updatedActiveAds = 0;

  for (const ad of rows) {
    const currentPhotos = toPhotoArray(ad.photos_json);
    if (currentPhotos.length === 0) {
      continue;
    }

    const nextPhotos = currentPhotos.map((photo) => uploadedUrlMap.get(photo) || photo);
    const changed = nextPhotos.some((photo, index) => photo !== currentPhotos[index]);
    if (!changed) {
      continue;
    }

    const { error: updateError } = await supabase
      .from("ads")
      .update({
        photos_json: nextPhotos,
        updated_at: new Date().toISOString(),
      })
      .eq("id", ad.id);

    if (updateError) {
      throw new Error(`Failed to update ad ${ad.id}: ${updateError.message}`);
    }

    updatedAds += 1;
    if (ad.status === "active") {
      updatedActiveAds += 1;
    }
  }

  console.log(
    JSON.stringify({
      uniqueSourceUrls: uniqueSourceUrls.length,
      updatedAds,
      updatedActiveAds,
    }),
  );
}

run().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Migration failed: ${message}`);
  process.exit(1);
});
