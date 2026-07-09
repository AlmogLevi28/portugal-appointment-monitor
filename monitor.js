const OWNER = "303dd3be";
const APPOINTMENT_TYPE_ID = "83816615";
const CALENDAR_ID = "12788063";
const TIMEZONE = "America/New_York";
const MONTHS_TO_CHECK = 5;
const BOOKING_URL =
  "https://agendamentosconsulares.as.me/schedule/303dd3be/appointment/83816615/calendar/12788063?calendarIds=12788063";

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function getTimestamp() {
  return new Date().toISOString();
}

function getMonthStartDates() {
  const months = [];
  const now = new Date();

  for (let i = 0; i < MONTHS_TO_CHECK; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    months.push(`${year}-${month}-01`);
  }

  return months;
}

async function sendTelegram(message) {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    console.log("Telegram secrets are missing. Message not sent.");
    return;
  }

  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: TELEGRAM_CHAT_ID,
      text: message,
      disable_web_page_preview: false
    })
  });

  if (!response.ok) {
    console.log(`Telegram failed: HTTP ${response.status}`);
  }
}

async function fetchWithRetry(url, retries = 2) {
  let lastError;

  for (let attempt = 1; attempt <= retries + 1; attempt++) {
    try {
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Accept": "application/json, text/plain, */*",
          "User-Agent": "Mozilla/5.0 Appointment Monitor"
        }
      });

      if (response.status === 403 || response.status === 429) {
        throw new Error(`Possible block or rate limit: HTTP ${response.status}`);
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      return response;
    } catch (error) {
      lastError = error;
      console.log(`Attempt ${attempt} failed: ${error.message}`);

      if (attempt <= retries) {
        await sleep(3000);
      }
    }
  }

  throw lastError;
}

async function checkMonth(monthDate) {
  const params = new URLSearchParams({
    owner: OWNER,
    appointmentTypeId: APPOINTMENT_TYPE_ID,
    calendarId: CALENDAR_ID,
    timezone: TIMEZONE,
    month: monthDate,
    queryParams: `calendarID%3D${CALENDAR_ID}`
  });

  const url =
    `https://agendamentosconsulares.as.me/api/scheduling/v1/availability/month?${params}`;

  const response = await fetchWithRetry(url);
  const data = await response.json();

  const possibleOpenings = Object.entries(data).filter(([date, value]) => {
    return value !== false;
  });

  return possibleOpenings;
}

async function main() {
  console.log(`[${getTimestamp()}] Checking Portugal appointment availability...`);

  const allOpenings = [];

  try {
    for (const monthDate of getMonthStartDates()) {
      console.log(`Checking ${monthDate}...`);

      const openings = await checkMonth(monthDate);

      if (openings.length > 0) {
        allOpenings.push(...openings);
      }

      await sleep(1000);
    }

    if (allOpenings.length > 0) {
      let message = "🇵🇹 POSSIBLE PORTUGAL APPOINTMENT FOUND!\n\n";

      for (const [date, value] of allOpenings) {
        message += `${date}: ${JSON.stringify(value)}\n`;
      }

      message += `\nBook here:\n${BOOKING_URL}`;

      console.log(message);
      await sendTelegram(message);
      return;
    }

    console.log("No appointments found.");
  } catch (error) {
    const errorMessage =
      `⚠️ Portugal appointment monitor problem\n\n` +
      `The website/API may be down, blocked, or changed.\n\n` +
      `Error: ${error.message}\n\n` +
      `Check manually:\n${BOOKING_URL}`;

    console.error(errorMessage);
    await sendTelegram(errorMessage);

    process.exit(1);
  }
}

main();
