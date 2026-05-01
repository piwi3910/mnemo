import * as React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { Checkbox } from "../checkbox";

describe("Checkbox", () => {
  it("renders an unchecked checkbox", () => {
    render(<Checkbox aria-label="Accept terms" />);
    const cb = screen.getByRole("checkbox", { name: /accept terms/i });
    expect(cb).toBeInTheDocument();
    expect(cb).not.toBeChecked();
  });

  it("calls onCheckedChange when clicked", async () => {
    const handler = vi.fn();
    render(<Checkbox aria-label="Check" onCheckedChange={handler} />);
    await userEvent.click(screen.getByRole("checkbox"));
    expect(handler).toHaveBeenCalledWith(true);
  });

  it("renders checked when defaultChecked", () => {
    render(<Checkbox aria-label="Checked" defaultChecked />);
    expect(screen.getByRole("checkbox")).toBeChecked();
  });
});
