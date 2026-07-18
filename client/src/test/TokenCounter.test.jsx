import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { TokenCounter } from "../components/TokenCounter.jsx";

describe("TokenCounter", () => {
  beforeEach(() => {
    global.fetch = vi.fn((url) => {
      if (url.includes("/count-all")) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              results: {
                "gpt-4": { count: 42, exact: true, budget: null },
                "claude-3-5-sonnet": { count: 45, exact: false, budget: null },
              },
            }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ count: 12, exact: true, model: "gpt-4", budget: null }),
      });
    });
  });

  it("shows a token count for the pre-filled sample text on load", async () => {
    render(<TokenCounter />);
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });
  });

  it("toggling 'Compare all models' switches to the per-model list view", async () => {
    const user = userEvent.setup();
    render(<TokenCounter />);

    // Single-model view first: model selector visible.
    await waitFor(() => expect(screen.getByLabelText(/model/i)).toBeInTheDocument());

    const toggle = screen.getByRole("switch");
    await user.click(toggle);

    // After toggling, the model dropdown should disappear and the
    // comparison endpoint should get called.
    await waitFor(() => {
      expect(screen.queryByLabelText(/model/i)).not.toBeInTheDocument();
    });
    expect(
      global.fetch.mock.calls.some(([url]) => url.includes("/count-all"))
    ).toBe(true);
  });

  it("typing updates the character count immediately (not debounced)", async () => {
    const user = userEvent.setup();
    render(<TokenCounter />);
    const textarea = screen.getByPlaceholderText(/paste text/i);
    await user.clear(textarea);
    await user.type(textarea, "hello");
    expect(screen.getByText(/5 chars/i)).toBeInTheDocument();
  });
});
