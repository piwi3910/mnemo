import * as React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { Switch } from "../switch";

describe("Switch", () => {
  it("renders in unchecked state by default", () => {
    render(<Switch aria-label="Toggle" />);
    expect(screen.getByRole("switch")).toHaveAttribute("data-state", "unchecked");
  });

  it("toggles state on click", async () => {
    render(<Switch aria-label="Toggle" />);
    const sw = screen.getByRole("switch");
    await userEvent.click(sw);
    expect(sw).toHaveAttribute("data-state", "checked");
  });

  it("calls onCheckedChange", async () => {
    const handler = vi.fn();
    render(<Switch aria-label="Toggle" onCheckedChange={handler} />);
    await userEvent.click(screen.getByRole("switch"));
    expect(handler).toHaveBeenCalledWith(true);
  });
});
