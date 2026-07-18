import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { Evaluator } from "../components/Evaluator.jsx";
import { ApiKeyProvider } from "../context/ApiKeyContext.jsx";
import * as evaluateApi from "../api/evaluate.js";

function renderEvaluator() {
  return render(
    <ApiKeyProvider>
      <Evaluator />
    </ApiKeyProvider>
  );
}

describe("Evaluator", () => {
  it("shows the setup panel when the server has no LLM and no user key is set", async () => {
    vi.spyOn(evaluateApi, "fetchEvaluateStatus").mockResolvedValue({ available: false, provider: null });
    renderEvaluator();
    await waitFor(() => {
      expect(screen.getByText(/no llm configured/i)).toBeInTheDocument();
    });
  });

  it("+ add reference answer toggles the reference textarea visible", async () => {
    vi.spyOn(evaluateApi, "fetchEvaluateStatus").mockResolvedValue({ available: true, provider: "gemini" });
    const user = userEvent.setup();
    renderEvaluator();

    await waitFor(() => expect(screen.getByRole("button", { name: /compare/i })).toBeInTheDocument());

    expect(screen.queryByPlaceholderText(/ground-truth answer/i)).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /add.*reference answer/i }));
    expect(screen.getByPlaceholderText(/ground-truth answer/i)).toBeInTheDocument();
  });

  it("marks the higher-scoring side as the winner", async () => {
    vi.spyOn(evaluateApi, "fetchEvaluateStatus").mockResolvedValue({ available: true, provider: "gemini" });
    vi.spyOn(evaluateApi, "compareContexts").mockResolvedValue({
      raw: { answer: "Vague raw answer.", tokensIn: 200, tokensOut: 10, latencyMs: 500, costEstimate: 0.0001 },
      engineered: {
        answer: "Precise engineered answer.",
        tokensIn: 20,
        tokensOut: 8,
        latencyMs: 300,
        costEstimate: 0.00002,
      },
      scoring: { method: "llm-judge", raw: 3, engineered: 9 },
      tokensSaved: 180,
      tokensSavedPercent: 90,
      costSaved: 0.00008,
    });

    const user = userEvent.setup();
    renderEvaluator();

    await waitFor(() => expect(screen.getByRole("button", { name: /^compare$/i })).toBeInTheDocument());
    await user.click(screen.getByRole("button", { name: /^compare$/i }));

    await waitFor(() => {
      expect(screen.getByText(/winner/i)).toBeInTheDocument();
    });

    // The winner badge should be inside the "Engineered context" result
    // card specifically (small uppercase heading), not the form label above.
    const engineeredHeading = screen.getAllByText(/engineered context/i).find(
      (el) => el.tagName === "SPAN" && el.className.includes("uppercase")
    );
    const engineeredCard = engineeredHeading.closest("div").parentElement;
    expect(engineeredCard.textContent).toMatch(/winner/i);
  });
});
