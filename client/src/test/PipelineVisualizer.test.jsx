import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { PipelineVisualizer } from "../components/PipelineVisualizer.jsx";
import { ApiKeyProvider } from "../context/ApiKeyContext.jsx";
import * as pipelineApi from "../api/pipeline.js";

const mockResult = {
  originalTokens: 100,
  finalTokens: 40,
  finalContext: "compressed text",
  finalMeaningPreserved: 0.8,
  overallReductionPercent: 60,
  llmAvailable: false,
  stages: {
    select: { chunkCount: 3, selectedCount: 2, tokensAfter: 60, embeddingMode: "tfidf", chunks: [] },
    compress: {
      tokensBefore: 60,
      tokensAfter: 40,
      compressionRatio: 33,
      meaningPreserved: 0.8,
      dedupedCount: 0,
      sentences: [],
    },
    summarize: { triggered: false, reason: "Already good enough." },
    evaluate: { skipped: true, reason: "No LLM configured." },
  },
};

function renderPipeline() {
  return render(
    <ApiKeyProvider>
      <PipelineVisualizer />
    </ApiKeyProvider>
  );
}

describe("PipelineVisualizer", () => {
  it("clicking Run Pipeline calls the API, shows a loading state, then reveals the result", async () => {
    const user = userEvent.setup();
    let resolvePromise;
    const controlledPromise = new Promise((resolve) => {
      resolvePromise = resolve;
    });
    const spy = vi.spyOn(pipelineApi, "runPipeline").mockReturnValue(controlledPromise);

    renderPipeline();
    await user.click(screen.getByRole("button", { name: /run pipeline/i }));

    expect(spy).toHaveBeenCalledTimes(1);
    // Loading state must be visible while the request is still in flight.
    expect(screen.getByRole("button", { name: /running pipeline/i })).toBeInTheDocument();

    resolvePromise(mockResult);

    // Wait for the staged reveal to finish (up to ~3.6s of real timers).
    await waitFor(
      () => {
        expect(screen.getByText(/60% reduction/i)).toBeInTheDocument();
      },
      { timeout: 5000 }
    );

    spy.mockRestore();
  }, 10000);

  it("shows an error message if the API call fails, and does not get stuck loading", async () => {
    const user = userEvent.setup();
    const spy = vi.spyOn(pipelineApi, "runPipeline").mockRejectedValue(new Error("Server unreachable"));

    renderPipeline();
    await user.click(screen.getByRole("button", { name: /run pipeline/i }));

    await waitFor(() => {
      expect(screen.getByText(/server unreachable/i)).toBeInTheDocument();
    });

    // Button must return to its clickable label, not stay stuck on "Running..."
    expect(screen.getByRole("button", { name: /^run pipeline$/i })).toBeEnabled();

    spy.mockRestore();
  });
});
