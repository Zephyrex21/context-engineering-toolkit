import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect } from "vitest";
import { ChatCompressor } from "../components/ChatCompressor.jsx";

describe("ChatCompressor", () => {
  it("starts with the sample conversation loaded", () => {
    render(<ChatCompressor />);
    expect(screen.getByText(/8 messages/i)).toBeInTheDocument();
  });

  it("+ add message adds a new row", async () => {
    const user = userEvent.setup();
    render(<ChatCompressor />);
    await user.click(screen.getByRole("button", { name: /add message/i }));
    expect(screen.getByText(/9 messages/i)).toBeInTheDocument();
  });

  it("clicking a role badge toggles user <-> assistant", async () => {
    const user = userEvent.setup();
    render(<ChatCompressor />);
    const roleButtons = screen.getAllByRole("button", { name: /^(user|assistant)$/i });
    const first = roleButtons[0];
    const before = first.textContent;
    await user.click(first);
    expect(first.textContent).not.toBe(before);
  });

  it("remove button (×) deletes a row", async () => {
    const user = userEvent.setup();
    render(<ChatCompressor />);
    expect(screen.getByText(/8 messages/i)).toBeInTheDocument();
    const removeButtons = screen.getAllByRole("button", { name: /remove message/i });
    await user.click(removeButtons[0]);
    expect(screen.getByText(/7 messages/i)).toBeInTheDocument();
  });

  it("Compress History button is disabled when there are zero messages", async () => {
    const user = userEvent.setup();
    render(<ChatCompressor />);
    const removeButtons = screen.getAllByRole("button", { name: /remove message/i });
    for (const btn of [...removeButtons]) {
      // list shrinks as we remove; always click the first remaining one
      await user.click(screen.getAllByRole("button", { name: /remove message/i })[0]);
    }
    expect(screen.getByText(/0 messages/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /compress history/i })).toBeDisabled();
  });
});
