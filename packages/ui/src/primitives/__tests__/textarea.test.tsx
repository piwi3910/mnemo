import * as React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect } from "vitest";
import { Textarea } from "../textarea";

describe("Textarea", () => {
  it("renders a textarea element", () => {
    render(<Textarea placeholder="Write something" />);
    expect(screen.getByPlaceholderText("Write something")).toBeInTheDocument();
  });

  it("accepts typed text", async () => {
    render(<Textarea />);
    const ta = screen.getByRole("textbox");
    await userEvent.type(ta, "multi\nline");
    expect(ta).toHaveValue("multi\nline");
  });
});
