import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { Compressor } from "../components/Compressor.jsx";
import * as compressApi from "../api/compress.js";

describe("Compressor", () => {
  it("clicking Compress calls the API and renders the result", async () => {
    const spy = vi.spyOn(compressApi, "compressText").mockResolvedValue({
      originalTokens: 100,
      compressedTokens: 40,
      compressionRatio: 60,
      compressedText: "Short version.",
      sentences: [{ index: 0, text: "Short version.", tokenCount: 3, score: 0.9, kept: true, dropReason: null }],
      meaningPreserved: 0.75,
      embeddingMode: "tfidf",
      dedupedCount: 1,
    });
    const user = userEvent.setup();

    render(<Compressor />);
    await user.click(screen.getByRole("button", { name: /^compress$/i }));

    expect(spy).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(screen.getByText(/60%/)).toBeInTheDocument());
  });

  it("shows an error and re-enables the button if the API call fails", async () => {
    vi.spyOn(compressApi, "compressText").mockRejectedValue(new Error("Bad request"));
    const user = userEvent.setup();

    render(<Compressor />);
    await user.click(screen.getByRole("button", { name: /^compress$/i }));

    await waitFor(() => expect(screen.getByText(/bad request/i)).toBeInTheDocument());
    expect(screen.getByRole("button", { name: /^compress$/i })).toBeEnabled();
  });
});
