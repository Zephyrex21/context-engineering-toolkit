import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { ChunkList } from "../components/ChunkList.jsx";

const sampleChunks = [
  { index: 0, text: "First chunk about relevant things.", tokenCount: 10, similarity: 0.8, tier: null, included: true },
  { index: 1, text: "Second chunk, less relevant.", tokenCount: 8, similarity: 0.3, tier: null, included: false },
];

describe("ChunkList", () => {
  it("calls onSetTier with the right args when 'always' is clicked", async () => {
    const user = userEvent.setup();
    const onSetTier = vi.fn();
    render(<ChunkList chunks={sampleChunks} maxSimilarity={0.8} onSetTier={onSetTier} />);

    const alwaysButtons = screen.getAllByRole("button", { name: "always" });
    await user.click(alwaysButtons[0]);
    expect(onSetTier).toHaveBeenCalledWith(0, "always");
  });

  it("clicking 'always' again (toggle off) calls onSetTier with null", async () => {
    const user = userEvent.setup();
    const onSetTier = vi.fn();
    const tieredChunks = [{ ...sampleChunks[0], tier: "always" }];
    render(<ChunkList chunks={tieredChunks} maxSimilarity={0.8} onSetTier={onSetTier} />);

    await user.click(screen.getByRole("button", { name: "always" }));
    expect(onSetTier).toHaveBeenCalledWith(0, null);
  });

  it("does not render tier buttons when onSetTier is not provided (read-only mode)", () => {
    render(<ChunkList chunks={sampleChunks} maxSimilarity={0.8} />);
    expect(screen.queryByRole("button", { name: "always" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "never" })).not.toBeInTheDocument();
  });

  it("renders nothing for an empty chunk list without crashing", () => {
    const { container } = render(<ChunkList chunks={[]} maxSimilarity={0} onSetTier={vi.fn()} />);
    expect(container).toBeEmptyDOMElement();
  });
});
