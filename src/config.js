function positiveInteger(name, fallback) {
  const raw = process.env[name];
  if (raw === undefined || raw === "") return fallback;
  const value = Number(raw);
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`${name} must be a positive integer`);
  }
  return value;
}

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
    monthsToCheck: positiveInteger("MONTHS_TO_CHECK", 5),

    requestDelayMs: positiveInteger("REQUEST_DELAY_MS", 1000),

    retries: positiveInteger("REQUEST_RETRIES", 3),

    timeoutMs: positiveInteger("REQUEST_TIMEOUT_MS", 10000),

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

export function bookingUrl() {
  const path = `/schedule/${encodeURIComponent(config.owner)}`
    + `/appointment/${encodeURIComponent(config.appointmentTypeId)}`
    + `/calendar/${encodeURIComponent(config.calendarId)}`;
  const query = new URLSearchParams({ calendarIds: config.calendarId });
  return `https://agendamentosconsulares.as.me${path}?${query}`;
}

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
