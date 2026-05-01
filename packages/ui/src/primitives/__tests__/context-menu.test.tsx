import * as React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect } from "vitest";
import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
} from "../context-menu";

describe("ContextMenu", () => {
  it("opens menu on right-click", async () => {
    render(
      <ContextMenu>
        <ContextMenuTrigger>Right-click here</ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem>Action</ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>,
    );
    await userEvent.pointer({
      target: screen.getByText("Right-click here"),
      keys: "[MouseRight]",
    });
    expect(await screen.findByText("Action")).toBeInTheDocument();
  });
});
