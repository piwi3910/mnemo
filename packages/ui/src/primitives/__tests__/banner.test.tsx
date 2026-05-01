import * as React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Banner, BannerTitle, BannerDescription } from "../banner";

describe("Banner", () => {
  it("renders with alert role", () => {
    render(<Banner>Info message</Banner>);
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });

  it("applies error variant classes", () => {
    render(<Banner variant="error">Error!</Banner>);
    expect(screen.getByRole("alert").className).toContain("bg-red");
  });

  it("renders title and description", () => {
    render(
      <Banner variant="success">
        <BannerTitle>Done</BannerTitle>
        <BannerDescription>Changes saved.</BannerDescription>
      </Banner>,
    );
    expect(screen.getByText("Done")).toBeInTheDocument();
    expect(screen.getByText("Changes saved.")).toBeInTheDocument();
  });
});
