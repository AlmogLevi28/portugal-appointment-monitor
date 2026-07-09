export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export async function randomDelay(minSeconds, maxSeconds) {
  const seconds = randomInt(minSeconds, maxSeconds);
  console.log(`Waiting ${seconds} seconds before starting...`);
  await sleep(seconds * 1000);
}

export function timeoutSignal(timeoutMs) {
  return AbortSignal.timeout(timeoutMs);
}
