import { config } from "./config.js";
import { log, error } from "./logger.js";
import { sleep } from "./utils.js";

export async function sendTelegram(message) {
  if (!config.telegram.token || !config.telegram.chatId) {
    log("Telegram is not configured.");
    return;
  }

  const url = `https://api.telegram.org/bot${config.telegram.token}/sendMessage`;

  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chat_id: config.telegram.chatId,
          text: message,
          disable_web_page_preview: false,
        }),
      });

      if (!response.ok) {
        throw new Error(`Telegram returned HTTP ${response.status}`);
      }

      log("Telegram notification sent.");
      return;
    } catch (err) {
      error(`Telegram attempt ${attempt} failed: ${err.message}`);

      if (attempt < 2) {
        await sleep(2000);
      }
    }
  }
}
