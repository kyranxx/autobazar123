import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  parseJsonBody,
  rejectWhenInvalidCsrf,
  rejectWhenStrictRateLimited,
  requireAuthenticatedUser,
} from "@/lib/api/route-helpers";
import { createClient } from "@/lib/supabase/server";
import { getSavedSearchesRateLimitIdentifier } from "@/lib/api/rate-limit-identifiers";
import {
  createSavedSearchFingerprint,
  createSavedSearchLabel,
  parseSavedSearchFilters,
} from "@/lib/search/saved-searches";

const CreateSavedSearchSchema = z
  .object({
    queryString: z.string().max(600).default(""),
    label: z.string().trim().max(120).optional(),
  })
  .strict();

const UpdateSavedSearchSchema = z
  .object({
    id: z.string().uuid(),
    label: z.string().trim().min(1).max(120).optional(),
    paused: z.boolean().optional(),
    notifyEmail: z.boolean().optional(),
  })
  .strict()
  .refine(
    (value) =>
      typeof value.label === "string"
      || typeof value.paused === "boolean"
      || typeof value.notifyEmail === "boolean",
    {
      message: "At least one saved search field must be updated.",
    },
  );

function buildFiltersFromQueryString(queryString: string) {
  return parseSavedSearchFilters(new URLSearchParams(queryString));
}

export async function GET() {
  const supabase = await createClient();
  const user = await requireAuthenticatedUser(supabase);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("saved_searches")
    .select(
      "id, label, query_string, filters_json, notify_email, paused, last_notified_listing_created_at, created_at, updated_at",
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to load saved searches:", error);
    return NextResponse.json(
      { error: "Unable to load saved searches right now." },
      { status: 400 },
    );
  }

  return NextResponse.json(
    { savedSearches: data ?? [] },
    { headers: { "Cache-Control": "no-store" } },
  );
}

export async function POST(request: NextRequest) {
  const csrfError = rejectWhenInvalidCsrf(request);
  if (csrfError) {
    return csrfError;
  }

  const rateLimitError = await rejectWhenStrictRateLimited(
    getSavedSearchesRateLimitIdentifier(request),
  );
  if (rateLimitError) {
    return rateLimitError;
  }

  const supabase = await createClient();
  const user = await requireAuthenticatedUser(supabase);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = await parseJsonBody(request, CreateSavedSearchSchema);
  if (!parsed) {
    return NextResponse.json({ error: "Invalid saved search payload" }, { status: 400 });
  }

  const filters = buildFiltersFromQueryString(parsed.queryString);
  const fingerprint = createSavedSearchFingerprint(filters);
  const label = parsed.label?.trim() || createSavedSearchLabel(filters);

  const { data, error } = await supabase
    .from("saved_searches")
    .upsert(
      {
        user_id: user.id,
        label,
        query_string: parsed.queryString,
        query_fingerprint: fingerprint,
        filters_json: filters,
        notify_email: true,
        paused: false,
      },
      {
        onConflict: "user_id,query_fingerprint",
        ignoreDuplicates: false,
      },
    )
    .select(
      "id, label, query_string, filters_json, notify_email, paused, last_notified_listing_created_at, created_at, updated_at",
    )
    .single();

  if (error) {
    console.error("Failed to save search:", error);
    return NextResponse.json(
      { error: "Unable to save this search right now." },
      { status: 400 },
    );
  }

  return NextResponse.json(
    { savedSearch: data },
    { headers: { "Cache-Control": "no-store" } },
  );
}

export async function PATCH(request: NextRequest) {
  const csrfError = rejectWhenInvalidCsrf(request);
  if (csrfError) {
    return csrfError;
  }

  const rateLimitError = await rejectWhenStrictRateLimited(
    getSavedSearchesRateLimitIdentifier(request),
  );
  if (rateLimitError) {
    return rateLimitError;
  }

  const supabase = await createClient();
  const user = await requireAuthenticatedUser(supabase);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = await parseJsonBody(request, UpdateSavedSearchSchema);
  if (!parsed) {
    return NextResponse.json({ error: "Invalid saved search update payload" }, { status: 400 });
  }

  const updatePayload: Record<string, unknown> = {};
  if (typeof parsed.label === "string") updatePayload.label = parsed.label.trim();
  if (typeof parsed.paused === "boolean") updatePayload.paused = parsed.paused;
  if (typeof parsed.notifyEmail === "boolean") updatePayload.notify_email = parsed.notifyEmail;

  const { data, error } = await supabase
    .from("saved_searches")
    .update(updatePayload)
    .eq("id", parsed.id)
    .eq("user_id", user.id)
    .select(
      "id, label, query_string, filters_json, notify_email, paused, last_notified_listing_created_at, created_at, updated_at",
    )
    .single();

  if (error) {
    console.error("Failed to update saved search:", error);
    return NextResponse.json(
      { error: "Unable to update this saved search right now." },
      { status: 400 },
    );
  }

  return NextResponse.json(
    { savedSearch: data },
    { headers: { "Cache-Control": "no-store" } },
  );
}

export async function DELETE(request: NextRequest) {
  const csrfError = rejectWhenInvalidCsrf(request);
  if (csrfError) {
    return csrfError;
  }

  const rateLimitError = await rejectWhenStrictRateLimited(
    getSavedSearchesRateLimitIdentifier(request),
  );
  if (rateLimitError) {
    return rateLimitError;
  }

  const supabase = await createClient();
  const user = await requireAuthenticatedUser(supabase);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const id = request.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing saved search id" }, { status: 400 });
  }

  const { error } = await supabase
    .from("saved_searches")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    console.error("Failed to delete saved search:", error);
    return NextResponse.json(
      { error: "Unable to delete this saved search right now." },
      { status: 400 },
    );
  }

  return NextResponse.json(
    { ok: true },
    { headers: { "Cache-Control": "no-store" } },
  );
}
