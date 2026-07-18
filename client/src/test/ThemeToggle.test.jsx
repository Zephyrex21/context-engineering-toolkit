import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, beforeEach } from "vitest";
import { ThemeProvider } from "../context/ThemeContext.jsx";
import { ThemeToggle } from "../components/ThemeToggle.jsx";

describe("ThemeToggle", () => {
  beforeEach(() => {
    document.documentElement.classList.remove("dark");
    window.localStorage.clear();
  });

  it("toggles the dark class on <html> when clicked", async () => {
    const user = userEvent.setup();
    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>
    );

    expect(document.documentElement.classList.contains("dark")).toBe(false);

    const button = screen.getByRole("button");
    await user.click(button);
    expect(document.documentElement.classList.contains("dark")).toBe(true);

    await user.click(button);
    expect(document.documentElement.classList.contains("dark")).toBe(false);
  });

  it("persists the choice to localStorage", async () => {
    const user = userEvent.setup();
    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>
    );
    await user.click(screen.getByRole("button"));
    expect(window.localStorage.getItem("context-toolkit-theme")).toBe("dark");
  });
});
