export function timestamp() {
  return new Date().toISOString();
}

export function log(message = "") {
  console.log(`[${timestamp()}] ${message}`);
}

export function warn(message = "") {
  console.warn(`[${timestamp()}] WARNING: ${message}`);
}

export function error(message = "") {
  console.error(`[${timestamp()}] ERROR: ${message}`);
}
