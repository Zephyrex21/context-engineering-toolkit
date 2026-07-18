import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { ThemeProvider } from "../context/ThemeContext.jsx";
import { ApiKeyProvider } from "../context/ApiKeyContext.jsx";
import { Sidebar } from "../components/Sidebar.jsx";

function renderSidebar(props) {
  return render(
    <ThemeProvider>
      <ApiKeyProvider>
        <Sidebar activeTab="pipeline" onSelect={vi.fn()} {...props} />
      </ApiKeyProvider>
    </ThemeProvider>
  );
}

describe("Sidebar", () => {
  it("calls onSelect with the correct id when a nav item is clicked", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    renderSidebar({ onSelect });

    await user.click(screen.getByRole("button", { name: /dashboard/i }));
    expect(onSelect).toHaveBeenCalledWith("dashboard");

    await user.click(screen.getByRole("button", { name: /token engine/i }));
    expect(onSelect).toHaveBeenCalledWith("tokens");
  });

  it("renders every nav item from the shared tabs config", () => {
    renderSidebar();
    ["Pipeline", "Dashboard", "Token Engine", "Context Selector", "Compressor", "Summarizer", "Evaluator"].forEach(
      (label) => {
        expect(screen.getByText(label)).toBeInTheDocument();
      }
    );
  });

  it("does not render any 'Phase' wording", () => {
    renderSidebar();
    expect(screen.queryByText(/phase/i)).not.toBeInTheDocument();
  });
});
