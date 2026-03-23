import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRole) {
  console.error(
    "Missing env vars. Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY",
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRole);

const FALLBACK_PHOTO_POOL = [
  "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1200&q=80",
  "https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=1200&q=80",
  "https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=1200&q=80",
  "https://images.unsplash.com/photo-1603584173870-7f23fdae1b7a?w=1200&q=80",
  "https://images.unsplash.com/photo-1555215695-3004980ad54e?w=1200&q=80",
  "https://images.unsplash.com/photo-1494905998402-395d579af36f?w=1200&q=80",
  "https://images.unsplash.com/photo-1502877338535-766e1452684a?w=1200&q=80",
  "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=1200&q=80",
  "https://images.unsplash.com/photo-1542281286-9e0a16bb7366?w=1200&q=80",
  "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=1200&q=80",
] as const;

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

function hashSeed(value: string): number {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }

  return hash;
}

function buildFallbackPhotos(adId: string, count = 3): string[] {
  const uniqueCount = Math.min(Math.max(count, 1), FALLBACK_PHOTO_POOL.length);
  const startIndex = hashSeed(adId) % FALLBACK_PHOTO_POOL.length;

  return Array.from({ length: uniqueCount }, (_, offset) => {
    const poolIndex = (startIndex + offset) % FALLBACK_PHOTO_POOL.length;
    return FALLBACK_PHOTO_POOL[poolIndex];
  });
}

async function run(): Promise<void> {
  console.log("Backfilling ads with missing photos...");

  const { data: ads, error } = await supabase
    .from("ads")
    .select("id, status, photos_json");

  if (error) {
    throw new Error(`Failed to load ads: ${error.message}`);
  }

  const candidates = (ads as AdRow[] | null) ?? [];
  const missingAds = candidates.filter((ad) => toPhotoArray(ad.photos_json).length === 0);

  if (missingAds.length === 0) {
    console.log("No ads need photo backfill.");
    return;
  }

  let updated = 0;
  let activeUpdated = 0;

  for (const ad of missingAds) {
    const photos = buildFallbackPhotos(ad.id);
    const { error: updateError } = await supabase
      .from("ads")
      .update({
        photos_json: photos,
        updated_at: new Date().toISOString(),
      })
      .eq("id", ad.id);

    if (updateError) {
      console.error(`Failed to update ad ${ad.id}: ${updateError.message}`);
      continue;
    }

    updated += 1;
    if (ad.status === "active") {
      activeUpdated += 1;
    }
  }

  console.log(
    JSON.stringify({
      missingAds: missingAds.length,
      updatedAds: updated,
      updatedActiveAds: activeUpdated,
      photoPoolSize: FALLBACK_PHOTO_POOL.length,
    }),
  );
}

run().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Backfill failed: ${message}`);
  process.exit(1);
});
