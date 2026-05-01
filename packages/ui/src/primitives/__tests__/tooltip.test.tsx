import * as React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect } from "vitest";
import {
  Tooltip,
  TooltipProvider,
  TooltipTrigger,
  TooltipContent,
} from "../tooltip";

describe("Tooltip", () => {
  it("shows tooltip content on hover", async () => {
    render(
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>Hover me</TooltipTrigger>
          <TooltipContent>Tooltip text</TooltipContent>
        </Tooltip>
      </TooltipProvider>,
    );
    await userEvent.hover(screen.getByText("Hover me"));
    // Radix renders the content in a portal and also an accessible aria span;
    // query by role="tooltip" to be unambiguous.
    expect(await screen.findByRole("tooltip")).toBeInTheDocument();
  });
});
