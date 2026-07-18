import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect } from "vitest";
import { ApiKeyProvider } from "../context/ApiKeyContext.jsx";
import { SettingsPanel } from "../components/SettingsPanel.jsx";

function renderPanel(props) {
  return render(
    <ApiKeyProvider>
      <SettingsPanel {...props} />
    </ApiKeyProvider>
  );
}

describe("SettingsPanel", () => {
  it("opens the key panel when clicked", async () => {
    const user = userEvent.setup();
    renderPanel();

    expect(screen.queryByPlaceholderText(/AIza/)).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /settings/i }));
    expect(screen.getByPlaceholderText(/AIza/)).toBeInTheDocument();
  });

  it("typing into the key field updates the trigger button's state", async () => {
    const user = userEvent.setup();
    renderPanel();

    await user.click(screen.getByRole("button", { name: /settings/i }));
    const input = screen.getByPlaceholderText(/AIza/);
    await user.type(input, "test-key-123");

    expect(screen.getByText(/using your key/i)).toBeInTheDocument();
  });

  it("switching provider changes the placeholder", async () => {
    const user = userEvent.setup();
    renderPanel();

    await user.click(screen.getByRole("button", { name: /settings/i }));
    expect(screen.getByPlaceholderText(/AIza/)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "groq" }));
    expect(screen.getByPlaceholderText(/gsk_/)).toBeInTheDocument();
  });

  it("clear key button empties the field and reverts trigger label", async () => {
    const user = userEvent.setup();
    renderPanel();

    await user.click(screen.getByRole("button", { name: /settings/i }));
    await user.type(screen.getByPlaceholderText(/AIza/), "test-key");
    expect(screen.getByText(/using your key/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /clear key/i }));
    expect(screen.getByPlaceholderText(/AIza/)).toHaveValue("");
  });

  it("compact variant renders an icon-only trigger", () => {
    renderPanel({ compact: true });
    expect(screen.getByRole("button", { name: /settings/i })).toBeInTheDocument();
  });

  it("closes when clicking outside the panel", async () => {
    const user = userEvent.setup();
    render(
      <div>
        <ApiKeyProvider>
          <SettingsPanel />
        </ApiKeyProvider>
        <button>outside element</button>
      </div>
    );

    await user.click(screen.getByRole("button", { name: /settings/i }));
    expect(screen.getByPlaceholderText(/AIza/)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /outside element/i }));
    expect(screen.queryByPlaceholderText(/AIza/)).not.toBeInTheDocument();
  });

  it("closes when Escape is pressed", async () => {
    const user = userEvent.setup();
    renderPanel();

    await user.click(screen.getByRole("button", { name: /settings/i }));
    expect(screen.getByPlaceholderText(/AIza/)).toBeInTheDocument();

    await user.keyboard("{Escape}");
    expect(screen.queryByPlaceholderText(/AIza/)).not.toBeInTheDocument();
  });

  it("does not close when clicking inside the panel (e.g. typing)", async () => {
    const user = userEvent.setup();
    renderPanel();

    await user.click(screen.getByRole("button", { name: /settings/i }));
    await user.click(screen.getByPlaceholderText(/AIza/));
    expect(screen.getByPlaceholderText(/AIza/)).toBeInTheDocument();
  });
});
