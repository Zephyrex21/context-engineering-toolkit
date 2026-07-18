import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { Home } from "../components/Home.jsx";

describe("Home", () => {
  it("'Run the Pipeline' navigates to the pipeline tab", async () => {
    const user = userEvent.setup();
    const onNavigate = vi.fn();
    render(<Home onNavigate={onNavigate} />);

    await user.click(screen.getByRole("button", { name: /run the pipeline/i }));
    expect(onNavigate).toHaveBeenCalledWith("pipeline");
  });

  it("'View Dashboard' navigates to the dashboard tab", async () => {
    const user = userEvent.setup();
    const onNavigate = vi.fn();
    render(<Home onNavigate={onNavigate} />);

    await user.click(screen.getByRole("button", { name: /view dashboard/i }));
    expect(onNavigate).toHaveBeenCalledWith("dashboard");
  });

  it("clicking a tool card navigates to that tool", async () => {
    const user = userEvent.setup();
    const onNavigate = vi.fn();
    render(<Home onNavigate={onNavigate} />);

    await user.click(screen.getByRole("button", { name: /compressor/i }));
    expect(onNavigate).toHaveBeenCalledWith("compress");
  });

  it("renders every tool from the shared config as a card", () => {
    render(<Home onNavigate={vi.fn()} />);
    ["Token Engine", "Context Selector", "Compressor", "Summarizer", "Evaluator", "Dashboard"].forEach((label) => {
      expect(screen.getByText(label)).toBeInTheDocument();
    });
  });

  it("renders no 'Phase' wording", () => {
    render(<Home onNavigate={vi.fn()} />);
    expect(screen.queryByText(/phase/i)).not.toBeInTheDocument();
  });
});
