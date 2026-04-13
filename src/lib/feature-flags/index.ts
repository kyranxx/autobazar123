/**
 * Server-side Feature Flag Utilities
 * Provides flag resolution with targeting support
 */
import { createClient } from "../supabase/server";
import {
  DEFAULT_FLAGS,
  FeatureFlag,
} from "@/config/feature-flags";

function hashUserId(userId: string): number {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    const char = userId.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash) % 100;
}

function isUserInRollout(
  userId: string | undefined,
  percentage: number,
): boolean {
  if (percentage >= 100) return true;
  if (percentage <= 0) return false;
  if (!userId) return false;
  return hashUserId(userId) < percentage;
}

function isUserTargeted(
  userId: string | undefined,
  targetUsers: string[],
): boolean {
  if (!targetUsers || targetUsers.length === 0) return false;
  if (!userId) return false;
  return targetUsers.includes(userId);
}

async function fetchFlagsFromDb(): Promise<Record<string, FeatureFlag>> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("feature_flags")
      .select(
        "key, name, description, enabled, rollout_percentage, target_users",
      );

    if (error) {
      console.error("Error fetching feature flags:", error);
      return { ...DEFAULT_FLAGS };
    }

    const flags: Record<string, FeatureFlag> = { ...DEFAULT_FLAGS };

    if (data) {
      for (const row of data) {
        flags[row.key] = {
          key: row.key,
          name: row.name,
          description: row.description,
          enabled: row.enabled,
          rolloutPercentage: row.rollout_percentage,
          targetUsers: row.target_users || [],
        };
      }
    }

    return flags;
  } catch {
    console.error("Failed to fetch feature flags from database");
    return { ...DEFAULT_FLAGS };
  }
}

export async function getFlagsForClient(
  userId?: string,
): Promise<Record<string, boolean>> {
  const flags = await fetchFlagsFromDb();
  const result: Record<string, boolean> = {};

  for (const [key, flag] of Object.entries(flags)) {
    if (isUserTargeted(userId, flag.targetUsers)) {
      result[key] = true;
    } else if (!flag.enabled) {
      result[key] = false;
    } else {
      result[key] = isUserInRollout(userId, flag.rolloutPercentage);
    }
  }

  return result;
}
