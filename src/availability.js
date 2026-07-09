import { buildMonthUrl, fetchJsonWithRetry, ApiError } from "./api.js";
import { log } from "./logger.js";

function classifyValue(value) {
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

  if (value && typeof value === "object") {
    return {
      available: true,
      reason: "OBJECT",
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
      log(
        `Unknown value returned for ${date}: ${JSON.stringify(value)}`
      );
    }
  }

  return openings;
}
