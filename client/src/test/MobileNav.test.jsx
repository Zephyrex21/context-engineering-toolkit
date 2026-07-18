import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { ThemeProvider } from "../context/ThemeContext.jsx";
import { ApiKeyProvider } from "../context/ApiKeyContext.jsx";
import { MobileNav } from "../components/MobileNav.jsx";

function renderMobileNav(props) {
  return render(
    <ThemeProvider>
      <ApiKeyProvider>
        <MobileNav activeTab="pipeline" onSelect={vi.fn()} {...props} />
      </ApiKeyProvider>
    </ThemeProvider>
  );
}

describe("MobileNav", () => {
  it("calls onSelect with the correct id when a pill is clicked", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    renderMobileNav({ onSelect });

    await user.click(screen.getByRole("button", { name: /compressor/i }));
    expect(onSelect).toHaveBeenCalledWith("compress");
  });

  it("renders no 'Phase' wording", () => {
    renderMobileNav();
    expect(screen.queryByText(/phase/i)).not.toBeInTheDocument();
  });

  it("settings gear opens the key panel without breaking tab navigation", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    renderMobileNav({ onSelect });

    await user.click(screen.getByRole("button", { name: /^settings$/i }));
    expect(screen.getByPlaceholderText(/AIza/)).toBeInTheDocument();

    // Clicking a tab while settings is open should still work (click-outside closes it, tab still registers).
    await user.click(screen.getByRole("button", { name: /token engine/i }));
    expect(onSelect).toHaveBeenCalledWith("tokens");
  });
});
