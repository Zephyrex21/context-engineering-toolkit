const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";
const IS_LOCAL_API = /localhost|127\.0\.0\.1/.test(API_URL);

/**
 * Turns a failed fetch() into a message that's actually useful for
 * whichever environment this is running in. A generic "server may be
 * waking up from sleep" message is correct for the deployed Render
 * instance and actively misleading for local dev, where the real cause is
 * almost always "the backend terminal isn't running" — a one-line check
 * versus a 40-second wait that will never resolve anything.
 */
export function unreachableServerMessage() {
  if (IS_LOCAL_API) {
    return `Can't reach the backend at ${API_URL}. Check that \`npm run dev\` is still running in your server/ terminal — if it crashed or was never started, that's almost always this error.`;
  }
  return "Can't reach the server. If this is the live demo, the backend may be waking up from sleep — try again in ~40s.";
}

export { API_URL };
