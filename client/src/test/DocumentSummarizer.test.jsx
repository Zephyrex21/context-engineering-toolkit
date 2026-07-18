import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { DocumentSummarizer } from "../components/DocumentSummarizer.jsx";
import * as summarizeApi from "../api/summarize.js";

describe("DocumentSummarizer", () => {
  it("clicking Summarize calls the API and renders the result", async () => {
    const spy = vi.spyOn(summarizeApi, "summarizeDocument").mockResolvedValue({
      originalTokens: 500,
      summaryTokens: 100,
      compressionRatio: 80,
      summary: "This is the summary.",
      mapChunkCount: 2,
      meaningPreserved: 0.7,
      provider: "gemini",
      model: "gemini-2.5-flash-lite",
      skipped: false,
    });
    const user = userEvent.setup();

    render(<DocumentSummarizer apiKey="" provider="gemini" />);
    await user.click(screen.getByRole("button", { name: /^summarize$/i }));

    expect(spy).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(screen.getByText(/this is the summary/i)).toBeInTheDocument());
  });

  it("does not get stuck on 'Summarizing...' after an error", async () => {
    vi.spyOn(summarizeApi, "summarizeDocument").mockRejectedValue(new Error("No LLM configured."));
    const user = userEvent.setup();

    render(<DocumentSummarizer apiKey="" provider="gemini" />);
    await user.click(screen.getByRole("button", { name: /^summarize$/i }));

    await waitFor(() => expect(screen.getByText(/no llm configured/i)).toBeInTheDocument());
    expect(screen.getByRole("button", { name: /^summarize$/i })).toBeEnabled();
  });
});
