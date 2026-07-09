import { config, validateConfig } from "./config.js";
import { log, error } from "./logger.js";
import { randomDelay } from "./utils.js";
import { sendTelegram } from "./telegram.js";
import { checkMonth } from "./availability.js";
import {
  loadState,
  saveState,
  updateSuccess,
  updateFailure,
  isNewAvailability,
  markAvailabilityAsSeen
} from "./state.js";

function getMonths() {
  const months = [];

  const today = new Date();

  for (let i = 0; i < config.monitor.monthsToCheck; i++) {

    const d = new Date(
      today.getFullYear(),
      today.getMonth() + i,
      1
    );

    const year = d.getFullYear();

    const month = String(d.getMonth() + 1).padStart(2, "0");

    months.push(`${year}-${month}-01`);
  }

  return months;
}

async function main() {

  validateConfig();

  const state = loadState();

  const started = Date.now();

  log("Portugal Appointment Monitor started.");

  await sendTelegram("✅ Test: Portugal Appointment Monitor is running.");

  if (config.monitor.randomDelay.enabled) {

    await randomDelay(
      config.monitor.randomDelay.minSeconds,
      config.monitor.randomDelay.maxSeconds
    );

  }

  const openings = [];

  try {

    for (const month of getMonths()) {

      const result = await checkMonth(month);

      openings.push(...result);

      await new Promise(r => setTimeout(r, config.monitor.requestDelayMs));

    }

    updateSuccess(state);

if (isNewAvailability(state, openings)) {
  
      let msg =
`🇵🇹 Portugal Appointment Found

`;

      for (const item of openings) {

        msg +=
`${item.date}
Reason: ${item.reason}

`;

      }

      msg +=
`Booking Page:

https://agendamentosconsulares.as.me/schedule/303dd3be/appointment/83816615/calendar/12788063?calendarIds=12788063`;

      await sendTelegram(msg);

      markAvailabilityAsSeen(state, openings);

      log("Telegram notification sent.");

    } else {

      log("No new availability.");

    }

    const seconds =
      ((Date.now() - started) / 1000).toFixed(2);

    log(`Finished in ${seconds}s`);

    saveState(state);

  }

  catch (err) {

    updateFailure(state, err);

    error(err.message);

    await sendTelegram(
`⚠️ Portugal Appointment Monitor

Error:

${err.message}

Type:

${err.type ?? "UNKNOWN"}

Status:

${err.status ?? "N/A"}`
    );

    throw err;

  }

}

main();
