import { buildMonthUrl, fetchJsonWithRetry, ApiError } from "./api.js";
import { log } from "./logger.js";

export function classifyValue(value) {
  if (value === false) {
    return {
      available: false,
      reason: "UNAVAILABLE",
    };
  }

  if (value === true) {
    return {
      available: true,
      reason: "BOOLEAN_TRUE",
    };
  }

  if (Array.isArray(value)) {
    return {
      available: value.length > 0,
      reason: "ARRAY",
    };
  }

  return {
    available: false,
    reason: "UNKNOWN_FORMAT",
    raw: value,
  };
}

export async function checkMonth(monthDate) {
  log(`Checking month ${monthDate}`);

  const url = buildMonthUrl(monthDate);

  const json = await fetchJsonWithRetry(url);

  if (!json || typeof json !== "object") {
    throw new ApiError(
      "Unexpected API response.",
      null,
      "INVALID_RESPONSE"
    );
  }

  const openings = [];
  const unknownValues = [];

  for (const [date, value] of Object.entries(json)) {
    const result = classifyValue(value);

    if (result.available) {
      openings.push({
        date,
        value,
        reason: result.reason,
      });
    }

    if (result.reason === "UNKNOWN_FORMAT") {
      unknownValues.push({ date, value });
      log(
        `Unknown value returned for ${date}: ${JSON.stringify(value)}`
      );
    }
  }

  if (unknownValues.length > 0) {
    throw new ApiError(
      `API returned an unknown availability format for ${unknownValues.length} date(s)`,
      null,
      "API_CHANGED"
    );
  }

  return openings;
}
