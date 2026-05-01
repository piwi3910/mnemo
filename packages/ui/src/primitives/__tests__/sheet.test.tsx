import * as React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect } from "vitest";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetTitle,
  SheetDescription,
} from "../sheet";

describe("Sheet", () => {
  it("opens when trigger is clicked", async () => {
    render(
      <Sheet>
        <SheetTrigger>Open Sheet</SheetTrigger>
        <SheetContent>
          <SheetTitle>Panel</SheetTitle>
          <SheetDescription>Side panel content</SheetDescription>
        </SheetContent>
      </Sheet>,
    );
    await userEvent.click(screen.getByText("Open Sheet"));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Panel")).toBeInTheDocument();
  });
});
