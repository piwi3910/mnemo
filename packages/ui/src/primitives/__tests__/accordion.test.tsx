import * as React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect } from "vitest";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "../accordion";

describe("Accordion", () => {
  function AccordionExample() {
    return (
      <Accordion type="single" collapsible>
        <AccordionItem value="item-1">
          <AccordionTrigger>Section 1</AccordionTrigger>
          <AccordionContent>Content 1</AccordionContent>
        </AccordionItem>
      </Accordion>
    );
  }

  it("renders the trigger", () => {
    render(<AccordionExample />);
    expect(screen.getByText("Section 1")).toBeInTheDocument();
  });

  it("expands content when trigger is clicked", async () => {
    render(<AccordionExample />);
    await userEvent.click(screen.getByText("Section 1"));
    expect(screen.getByText("Content 1")).toBeVisible();
  });
});
