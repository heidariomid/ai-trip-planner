const OFFLINE = "No internet connection. Check your network and try again.";

const NETWORK_FAILURE = /network request failed|failed to fetch|load failed|networkerror/i;

function messageOf(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "object" && error !== null && "message" in error) {
    return String((error as { message: unknown }).message);
  }
  return "";
}

/**
 * Turns a failed data or Storage call into a sentence a traveller can act on.
 * The raw error is logged for us; it is never shown to them.
 */
export function toReadableError(scope: string, error: unknown, fallback: string): string {
  console.error(`[${scope}]`, error);
  return NETWORK_FAILURE.test(messageOf(error)) ? OFFLINE : fallback;
}
