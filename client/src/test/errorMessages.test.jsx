import { describe, it, expect } from "vitest";
import { unreachableServerMessage } from "../api/errorMessages.js";

describe("unreachableServerMessage", () => {
  it("gives local-dev-specific guidance when VITE_API_URL points to localhost", () => {
    // The test env's VITE_API_URL defaults to localhost (see client/.env / vite defaults),
    // so this exercises the actual code path a local `npm run dev` user hits.
    const msg = unreachableServerMessage();
    expect(msg).toMatch(/npm run dev/i);
    expect(msg).not.toMatch(/waking up from sleep/i);
  });
});
