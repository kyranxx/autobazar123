import { NextResponse } from "next/server";
import {
  getRuntimeEnvConfigurationError,
  type RuntimeEnvProfile,
} from "@/lib/env";

export function rejectWhenRuntimeEnvMissing(
  profile: RuntimeEnvProfile,
  error: string,
) {
  const configError = getRuntimeEnvConfigurationError(profile);
  if (!configError) {
    return null;
  }

  console.error(configError.message);
  return NextResponse.json({ error }, { status: 503 });
}
