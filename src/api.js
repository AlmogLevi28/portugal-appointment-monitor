import { config } from "./config.js";
import { sleep, timeoutSignal } from "./utils.js";
import { log } from "./logger.js";

export class ApiError extends Error {
  constructor(message, status = null, type = "UNKNOWN") {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.type = type;
  }
}

function classifyStatus(status) {
  if (status === 403) return "BLOCKED_403";
  if (status === 429) return "RATE_LIMIT_429";
  if (status >= 500) return "SERVER_ERROR";
  if (status >= 400) return "CLIENT_ERROR";
  return "UNKNOWN";
}

export function buildMonthUrl(monthDate) {
  const params = new URLSearchParams({
    owner: config.owner,
    appointmentTypeId: config.appointmentTypeId,
    calendarId: config.calendarId,
    timezone: config.timezone,
    month: monthDate,
    queryParams: `calendarID%3D${config.calendarId}`,
  });

  return `https://agendamentosconsulares.as.me/api/scheduling/v1/availability/month?${params}`;
}

export async function fetchJsonWithRetry(url) {
  let lastError = null;

  for (let attempt = 1; attempt <= config.monitor.retries; attempt++) {
    try {
      const started = Date.now();

      const response = await fetch(url, {
        method: "GET",
        signal: timeoutSignal(config.monitor.timeoutMs),
        headers: {
          Accept: "application/json, text/plain, */*",
          "User-Agent": "Mozilla/5.0 Portugal Appointment Monitor",
        },
      });

      const ms = Date.now() - started;
      log(`HTTP ${response.status} in ${ms}ms`);

      if (!response.ok) {
        throw new ApiError(
          `HTTP ${response.status}`,
          response.status,
          classifyStatus(response.status)
        );
      }

      const text = await response.text();

      try {
        return JSON.parse(text);
      } catch {
        throw new ApiError(
          "Response was not valid JSON",
          response.status,
          "INVALID_JSON"
        );
      }
    } catch (err) {
      lastError = err;

      if (attempt < config.monitor.retries) {
        const waitMs = 1500 * attempt;
        log(`Attempt ${attempt} failed. Retrying in ${waitMs}ms...`);
        await sleep(waitMs);
      }
    }
  }

  if (lastError?.name === "AbortError") {
    throw new ApiError("Request timed out", null, "TIMEOUT");
  }

  if (lastError instanceof ApiError) {
    throw lastError;
  }

  throw new ApiError(lastError?.message || "Network error", null, "NETWORK_ERROR");
}
