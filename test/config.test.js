import test from "node:test";
import assert from "node:assert/strict";
import { bookingUrl, config, validateConfig } from "../src/config.js";

function withConfig(values, fn) {
  const original = {
    owner: config.owner,
    appointmentTypeId: config.appointmentTypeId,
    calendarId: config.calendarId,
    telegram: { ...config.telegram },
  };
  Object.assign(config, values, {
    telegram: { ...config.telegram, ...values.telegram },
  });
  try {
    fn();
  } finally {
    Object.assign(config, original);
  }
}

const complete = {
  owner: "owner1",
  appointmentTypeId: "123",
  calendarId: "456",
  telegram: { token: "test-token", chatId: "789" },
};

test("builds the booking URL from configured IDs", () => {
  withConfig(complete, () => {
    assert.equal(
      bookingUrl(),
      "https://agendamentosconsulares.as.me/schedule/owner1"
        + "/appointment/123/calendar/456?calendarIds=456"
    );
  });
});

test("encodes IDs in the booking URL", () => {
  withConfig({ ...complete, owner: "a/b c" }, () => {
    assert.match(bookingUrl(), /\/schedule\/a%2Fb%20c\/appointment\//);
  });
});

test("accepts a complete configuration", () => {
  withConfig(complete, () => {
    assert.doesNotThrow(validateConfig);
  });
});

test("lists every missing required setting", () => {
  withConfig(
    { ...complete, calendarId: "", telegram: { chatId: undefined } },
    () => {
      assert.throws(validateConfig, error => {
        assert.match(error.message, /CALENDAR_ID/);
        assert.match(error.message, /TELEGRAM_CHAT_ID/);
        assert.doesNotMatch(error.message, /OWNER_ID/);
        return true;
      });
    }
  );
});
