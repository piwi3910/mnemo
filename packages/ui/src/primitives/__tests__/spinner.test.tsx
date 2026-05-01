import * as React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Spinner } from "../spinner";

describe("Spinner", () => {
  it("renders with loading role", () => {
    render(<Spinner />);
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("renders with animate-spin class", () => {
    render(<Spinner />);
    expect(screen.getByRole("status").className).toContain("animate-spin");
  });

  it("accepts size prop", () => {
    render(<Spinner size="lg" />);
    expect(screen.getByRole("status").className).toContain("h-8");
  });
});
