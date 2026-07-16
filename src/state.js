import fs from "fs";
import crypto from "crypto";

const STATE_FILE = "state.json";

const DEFAULT_STATE = {
  lastAvailabilityHash: null,
  lastAvailabilitySummary: [],
  lastSuccessfulRun: null,
  lastError: null,
  runs: [],
  stats: {
    totalRuns: 0,
    successfulRuns: 0,
    failedRuns: 0,
    availabilityRuns: 0,
  },
};

export function loadState() {
  if (!fs.existsSync(STATE_FILE)) {
    return structuredClone(DEFAULT_STATE);
  }

  try {
    const raw = fs.readFileSync(STATE_FILE, "utf8");
    return {
      ...structuredClone(DEFAULT_STATE),
      ...JSON.parse(raw),
    };
  } catch {
    return structuredClone(DEFAULT_STATE);
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

function keepLast7DaysOnly(state) {
  const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;

  state.runs = (state.runs || []).filter(run => {
    return new Date(run.time).getTime() >= cutoff;
  });
}

export function updateSuccess(state, openings = []) {
  state.stats.totalRuns += 1;
  state.stats.successfulRuns += 1;
  state.lastSuccessfulRun = new Date().toISOString();
  state.lastError = null;

  if (openings.length > 0) {
    state.stats.availabilityRuns += 1;
  }

  state.runs = state.runs || [];

  state.runs.push({
    time: new Date().toISOString(),
    status: "success",
    availabilityFound: openings.length > 0,
    availabilityCount: openings.length,
    openings,
  });

  keepLast7DaysOnly(state);
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

  state.runs = state.runs || [];

  state.runs.push({
    time: new Date().toISOString(),
    status: "failed",
    error: state.lastError,
  });

  keepLast7DaysOnly(state);
}

export function isNewAvailability(state, openings) {
  if (openings.length === 0) {
    return false;
  }

  const currentHash = hashOpenings(openings);
  return currentHash !== state.lastAvailabilityHash;
}

export function markAvailabilityAsSeen(state, openings) {
  state.lastAvailabilityHash = openings.length > 0
    ? hashOpenings(openings)
    : null;
  state.lastAvailabilitySummary = openings;
}
