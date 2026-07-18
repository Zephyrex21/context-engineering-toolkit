import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { ContextSelector } from "../components/ContextSelector.jsx";
import * as contextApi from "../api/context.js";

const baseResult = {
  chunks: [
    { index: 0, text: "Chunk zero.", tokenCount: 10, similarity: 0.5, tier: null, included: true },
    { index: 1, text: "Chunk one.", tokenCount: 10, similarity: 0.3, tier: null, included: false },
  ],
  selected: [{ index: 0, text: "Chunk zero.", tokenCount: 10, similarity: 0.5, tier: null, included: true }],
  totalTokens: 10,
  budget: { limit: 80, used: 10, remaining: 70, withinBudget: true },
  embeddingMode: "tfidf",
  chunkCount: 2,
};

describe("ContextSelector", () => {
  it("clicking Select Context calls the API", async () => {
    vi.spyOn(contextApi, "fetchContextStatus").mockResolvedValue({ embeddingMode: "tfidf" });
    const spy = vi.spyOn(contextApi, "selectContext").mockResolvedValue(baseResult);
    const user = userEvent.setup();

    render(<ContextSelector />);
    await user.click(screen.getByRole("button", { name: /select context/i }));

    expect(spy).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(screen.getByText(/chunk zero/i)).toBeInTheDocument());
  });

  it("clicking a chunk's 'always' button triggers an automatic re-fetch with the override included", async () => {
    vi.spyOn(contextApi, "fetchContextStatus").mockResolvedValue({ embeddingMode: "tfidf" });
    const spy = vi.spyOn(contextApi, "selectContext").mockResolvedValue(baseResult);
    const user = userEvent.setup();

    render(<ContextSelector />);
    await user.click(screen.getByRole("button", { name: /select context/i }));
    await waitFor(() => expect(screen.getByText(/chunk one/i)).toBeInTheDocument());

    expect(spy).toHaveBeenCalledTimes(1);

    const alwaysButtons = screen.getAllByRole("button", { name: "always" });
    await user.click(alwaysButtons[1]); // tag chunk 1 (the excluded one) as always-include

    await waitFor(() => expect(spy).toHaveBeenCalledTimes(2));
    const secondCallArgs = spy.mock.calls[1][0];
    expect(secondCallArgs.overrides).toEqual([{ index: 1, tier: "always" }]);
  });
});
