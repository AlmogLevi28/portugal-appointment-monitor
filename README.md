# Portugal Appointment Monitor

Checks Portugal consular appointment availability and sends Telegram alerts when new dates appear. GitHub Actions runs the monitor on a schedule and stores recent run state in `state.json`.

## Configuration

Create these GitHub Actions repository secrets under **Settings → Secrets and variables → Actions**:

- `OWNER_ID`: Acuity Scheduling owner ID
- `APPOINTMENT_TYPE_ID`: appointment type ID
- `CALENDAR_ID`: calendar ID
- `TELEGRAM_BOT_TOKEN`: token from BotFather
- `TELEGRAM_CHAT_ID`: destination chat ID
- `TIMEZONE`: optional IANA timezone; defaults to `America/New_York`

See `.env.example` for optional request and monitoring settings. Never commit real tokens or credentials.

## Run locally

Node.js 22 or newer is required.

```bash
cp .env.example .env
set -a
source .env
set +a
npm start
```

## Tests

```bash
npm test
```

Tests cover API value classification and notification deduplication, including the disappearance and reappearance of the same appointment date.

## Operations

- `.github/workflows/check.yml` performs scheduled checks and prevents overlapping monitor runs.
- `.github/workflows/daily-summary.yml` sends a daily Telegram summary.
- A Telegram delivery failure makes the monitor fail instead of silently marking an alert as delivered.
- Unknown API response shapes fail loudly to reduce false-positive appointment alerts.

GitHub scheduled workflows may be delayed during periods of high demand. Keep polling intervals respectful and comply with the appointment provider's applicable terms and limits.
