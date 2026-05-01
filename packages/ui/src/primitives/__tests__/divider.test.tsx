import * as React from "react";
import { render } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Divider } from "../divider";

describe("Divider", () => {
  it("renders a horizontal divider (hr) by default", () => {
    const { container } = render(<Divider />);
    expect(container.querySelector("hr")).toBeInTheDocument();
  });

  it("renders a vertical divider (div) when orientation is vertical", () => {
    const { container } = render(<Divider orientation="vertical" />);
    expect(container.querySelector("div")).toBeInTheDocument();
    expect(container.querySelector("hr")).not.toBeInTheDocument();
  });
});
