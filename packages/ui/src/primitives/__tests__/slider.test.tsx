import * as React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect, beforeAll } from "vitest";
import { Slider } from "../slider";

// Radix's use-size hook uses ResizeObserver which jsdom does not implement.
beforeAll(() => {
  if (typeof window.ResizeObserver === "undefined") {
    class ResizeObserverMock {
      observe() {}
      unobserve() {}
      disconnect() {}
    }
    window.ResizeObserver =
      ResizeObserverMock as unknown as typeof ResizeObserver;
  }
});

describe("Slider", () => {
  it("renders a slider", () => {
    render(<Slider defaultValue={[50]} min={0} max={100} />);
    expect(screen.getByRole("slider")).toBeInTheDocument();
  });

  it("reflects default value as aria-valuenow", () => {
    render(<Slider defaultValue={[30]} min={0} max={100} />);
    expect(screen.getByRole("slider")).toHaveAttribute("aria-valuenow", "30");
  });
});
