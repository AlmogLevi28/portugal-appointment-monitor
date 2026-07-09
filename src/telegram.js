import { config } from "./config.js";
import { log, error } from "./logger.js";

export async function sendTelegram(message) {
  if (!config.telegram.token || !config.telegram.chatId) {
    log("Telegram is not configured.");
    return;
  }

  try {
    const response = await fetch(
      `https://api.telegram.org/bot${config.telegram.token}/sendMessage`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chat_id: config.telegram.chatId,
          text: message,
          disable_web_page_preview: false,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Telegram returned HTTP ${response.status}`);
    }

    log("Telegram notification sent.");
  } catch (err) {
    error(`Unable to send Telegram message: ${err.message}`);
  }
}
