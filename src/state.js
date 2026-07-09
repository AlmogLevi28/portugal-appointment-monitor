import fs from "fs";
import crypto from "crypto";
import { log } from "./logger.js";

const STATE_FILE = "state.json";

const DEFAULT_STATE = {
  lastAvailabilityHash: null,
  lastAvailabilitySummary: [],
  lastSuccessfulRun: null,
  lastError: null,
  stats: {
    totalRuns: 0,
    successfulRuns: 0,
    failedRuns: 0,
  },
};

export function loadState() {
  if (!fs.existsSync(STATE_FILE)) {
    return { ...DEFAULT_STATE };
  }

  try {
    const raw = fs.readFileSync(STATE_FILE, "utf8");
    return { ...DEFAULT_STATE, ...JSON.parse(raw) };
  } catch {
    log("Could not read state.json. Using default state.");
    return { ...DEFAULT_STATE };
  }
}

export function saveState(state) {
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

export function hashOpenings(openings) {
  const normalized = openings
    .map(opening => ({
      date: opening.date,
      value: opening.value,
      reason: opening.reason,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return crypto
    .createHash("sha256")
    .update(JSON.stringify(normalized))
    .digest("hex");
}

export function updateSuccess(state) {
  state.stats.totalRuns += 1;
  state.stats.successfulRuns += 1;
  state.lastSuccessfulRun = new Date().toISOString();
  state.lastError = null;

  saveState(state);
}

export function markAvailabilityAsSeen(state, openings) {
  state.lastAvailabilityHash = hashOpenings(openings);
  state.lastAvailabilitySummary = openings;

  saveState(state);
}

export function updateFailure(state, error) {
  state.stats.totalRuns += 1;
  state.stats.failedRuns += 1;
  state.lastError = {
    message: error.message,
    type: error.type || "UNKNOWN",
    status: error.status || null,
    time: new Date().toISOString(),
  };

  saveState(state);
}

export function isNewAvailability(state, openings) {
  if (openings.length === 0) {
    return false;
  }

  const currentHash = hashOpenings(openings);
  return currentHash !== state.lastAvailabilityHash;
}
