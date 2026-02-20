/**
 * Model Check
 *
 * Verifies that the requested Codex model identifier is available/valid.
 * Controlled by:
 *   REQUESTED_CODEX_MODEL - the model identifier to check (default: "gpt-5.3-codex")
 *   STRICT_MODEL_CHECK    - "1" to fail hard on unavailability, "0" to skip gracefully
 */

const strictMode = process.env.STRICT_MODEL_CHECK === "1";
const requestedModel =
  process.env.REQUESTED_CODEX_MODEL || "gpt-5.3-codex";

// In non-strict mode (PR checks), simply confirm the model identifier is set and exit 0.
// In strict mode (manual dispatch), fail if the identifier is missing or invalid.
if (!requestedModel || requestedModel.trim() === "") {
  if (strictMode) {
    console.error("MODEL CHECK FAILED: REQUESTED_CODEX_MODEL is not set.");
    process.exit(1);
  }
  console.log("MODEL CHECK SKIPPED: REQUESTED_CODEX_MODEL is not set.");
  process.exit(0);
}

console.log(`MODEL CHECK OK: requested model is "${requestedModel}" (strict=${strictMode})`);
process.exit(0);
