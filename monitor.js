const OWNER = "303dd3be";
const APPOINTMENT_TYPE_ID = "83816615";
const CALENDAR_ID = "12788063";
const TIMEZONE = "America/New_York";
const MONTHS_TO_CHECK = 5;

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

async function checkMonth(monthDate) {
  const params = new URLSearchParams({
    owner: OWNER,
    appointmentTypeId: APPOINTMENT_TYPE_ID,
    calendarId: CALENDAR_ID,
    timezone: TIMEZONE,
    month: monthDate,
    queryParams: `calendarID%3D${CALENDAR_ID}`
  });

  const url = `https://agendamentosconsulares.as.me/api/scheduling/v1/availability/month?${params}`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Accept": "application/json, text/plain, */*"
    }
  });

  if (!response.ok) {
    throw new Error(`Request failed for ${monthDate}: HTTP ${response.status}`);
  }

  const data = await response.json();

  const possibleOpenings = Object.entries(data).filter(([date, value]) => {
    return value !== false;
  });

  return possibleOpenings;
}

async function main() {
  console.log("Checking Portugal appointment availability...");
  console.log(`Checking next ${MONTHS_TO_CHECK} months.`);

  let allOpenings = [];

  for (const monthDate of getMonthStartDates()) {
    console.log(`Checking ${monthDate}...`);

    const openings = await checkMonth(monthDate);

    if (openings.length > 0) {
      allOpenings.push(...openings);
    }
  }

  if (allOpenings.length > 0) {
    console.log("\n==============================");
    console.log("POSSIBLE APPOINTMENT FOUND");
    console.log("==============================");

    for (const [date, value] of allOpenings) {
      console.log(`${date}: ${JSON.stringify(value)}`);
    }

    process.exit(1);
  }

  console.log("No appointments found.");
}

main().catch(error => {
  console.error("Error:", error.message);
  process.exit(1);
});
