import * as React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { Resizer } from "../resizer";
import { fireEvent } from "@testing-library/react";

describe("Resizer", () => {
  it("renders a separator element", () => {
    render(<Resizer />);
    expect(screen.getByRole("separator")).toBeInTheDocument();
  });

  it("fires onResize with delta on drag", () => {
    const handler = vi.fn();
    render(<Resizer onResize={handler} />);
    const sep = screen.getByRole("separator");
    fireEvent.mouseDown(sep, { clientX: 100 });
    fireEvent.mouseMove(document, { clientX: 150 });
    fireEvent.mouseUp(document);
    expect(handler).toHaveBeenCalledWith(50);
  });

  it("uses vertical orientation", () => {
    render(<Resizer orientation="vertical" />);
    const sep = screen.getByRole("separator");
    expect(sep).toHaveAttribute("aria-orientation", "vertical");
  });
});
