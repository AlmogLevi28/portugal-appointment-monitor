import { loadState } from "./state.js";
import { sendTelegram } from "./telegram.js";

const state = loadState();

const now = Date.now();
const last24Hours = now - 24 * 60 * 60 * 1000;

const runs = (state.runs || []).filter(run => {
  return new Date(run.time).getTime() >= last24Hours;
});

const totalChecks = runs.length;
const successfulChecks = runs.filter(run => run.status === "success").length;
const failedChecks = runs.filter(run => run.status === "failed").length;
const availabilityChecks = runs.filter(run => run.availabilityFound).length;

const lastErrorRun = [...runs]
  .reverse()
  .find(run => run.status === "failed");

const lastAvailabilityRun = [...runs]
  .reverse()
  .find(run => run.availabilityFound);

const message =
`🇵🇹 Portugal Monitor Daily Summary

Last 24 hours:

Checks attempted:
${totalChecks}

Successful checks:
${successfulChecks}

Failed checks:
${failedChecks}

Availability detected:
${availabilityChecks}

Current result:
${availabilityChecks > 0 ? "Appointment availability was detected." : "No appointments available."}

Last successful check:
${state.lastSuccessfulRun ?? "None"}

Last error:
${lastErrorRun ? lastErrorRun.error.message : "None"}

Last availability:
${lastAvailabilityRun
  ? JSON.stringify(lastAvailabilityRun.openings, null, 2)
  : "None"}
`;

await sendTelegram(message);
