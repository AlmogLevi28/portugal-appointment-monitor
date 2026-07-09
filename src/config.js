export const config = {
  owner: process.env.OWNER_ID,
  appointmentTypeId: process.env.APPOINTMENT_TYPE_ID,
  calendarId: process.env.CALENDAR_ID,
  timezone: process.env.TIMEZONE || "America/New_York",

  telegram: {
    token: process.env.TELEGRAM_BOT_TOKEN,
    chatId: process.env.TELEGRAM_CHAT_ID,
  },

  monitor: {
    monthsToCheck: 5,

    requestDelayMs: 1000,

    retries: 3,

    timeoutMs: 10000,

    randomDelay: {
      enabled: true,
      minSeconds: 5,
      maxSeconds: 25,
    },

    notifications: {
      appointmentFound: true,
      apiChanged: true,
      blocked403: true,
      rateLimit429: true,
      serverError: true,
      networkError: true,
      startupMessage: false,
      heartbeat: false,
    },
  },
};

export function validateConfig() {
  const required = [
    ["OWNER_ID", config.owner],
    ["APPOINTMENT_TYPE_ID", config.appointmentTypeId],
    ["CALENDAR_ID", config.calendarId],
    ["TELEGRAM_BOT_TOKEN", config.telegram.token],
    ["TELEGRAM_CHAT_ID", config.telegram.chatId],
  ];

  const missing = required
    .filter(([, value]) => !value)
    .map(([name]) => name);

  if (missing.length > 0) {
    throw new Error(
      `Missing GitHub Secrets:\n\n${missing.join("\n")}`
    );
  }
}
