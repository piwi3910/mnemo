import * as React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { RadioGroup, RadioGroupItem } from "../radio-group";

describe("RadioGroup", () => {
  it("renders radio items", () => {
    render(
      <RadioGroup defaultValue="a">
        <RadioGroupItem value="a" aria-label="Option A" />
        <RadioGroupItem value="b" aria-label="Option B" />
      </RadioGroup>,
    );
    expect(screen.getAllByRole("radio")).toHaveLength(2);
  });

  it("calls onValueChange on selection", async () => {
    const handler = vi.fn();
    render(
      <RadioGroup onValueChange={handler}>
        <RadioGroupItem value="x" aria-label="X" />
      </RadioGroup>,
    );
    await userEvent.click(screen.getByRole("radio", { name: "X" }));
    expect(handler).toHaveBeenCalledWith("x");
  });
});
