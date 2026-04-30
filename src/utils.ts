import * as ynab from "ynab";
import { CHARACTER_LIMIT } from "./constants.js";

export function formatMilliunits(milliunits: number, decimalDigits = 2): string {
  const amount = ynab.utils.convertMilliUnitsToCurrencyAmount(
    milliunits,
    decimalDigits
  );
  return amount.toFixed(decimalDigits);
}

export function toMilliunits(amount: number): number {
  return Math.round(amount * 1000);
}

interface YnabApiError {
  error: { id: string; name: string; detail: string };
}

function isYnabApiError(e: unknown): e is YnabApiError {
  return (
    typeof e === "object" &&
    e !== null &&
    "error" in e &&
    typeof (e as YnabApiError).error === "object"
  );
}

export function handleYnabError(error: unknown): string {
  if (isYnabApiError(error)) {
    const { id, name, detail } = error.error;
    switch (id) {
      case "401":
        return `Error: Invalid YNAB API token. Check the ${process.env["YNAB_API_TOKEN"] ? "value of" : "presence of"} YNAB_API_TOKEN.`;
      case "404":
        return `Error: Resource not found. ${detail}`;
      case "429":
        return "Error: YNAB rate limit exceeded. Wait a moment before retrying.";
      case "503":
        return `Error: YNAB API is currently unavailable. ${detail}`;
      default:
        return `Error: YNAB API error ${id} (${name}): ${detail}`;
    }
  }
  if (error instanceof Error) return `Error: ${error.message}`;
  return `Error: ${String(error)}`;
}

export function truncateIfNeeded(text: string, hint = ""): string {
  if (text.length <= CHARACTER_LIMIT) return text;
  const suffix = hint
    ? `\n\n[Output truncated at ${CHARACTER_LIMIT} characters. ${hint}]`
    : `\n\n[Output truncated at ${CHARACTER_LIMIT} characters. Use filters or pagination to narrow results.]`;
  return text.slice(0, CHARACTER_LIMIT) + suffix;
}

export function jsonResponse(data: unknown, truncationHint = ""): string {
  const text = JSON.stringify(data, null, 2);
  return truncateIfNeeded(text, truncationHint);
}
