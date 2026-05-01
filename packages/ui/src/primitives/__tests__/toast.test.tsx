import * as React from "react";
import { render } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Toaster } from "../toast";

describe("Toaster", () => {
  it("renders without crashing", () => {
    // Sonner renders a portal — in jsdom we just verify no exceptions are thrown
    // and the component mounts cleanly.
    expect(() => render(<Toaster />)).not.toThrow();
  });

  it("renders with custom position prop", () => {
    // Verify prop forwarding doesn't cause errors
    expect(() => render(<Toaster position="top-center" />)).not.toThrow();
  });
});
