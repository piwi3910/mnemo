import * as React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Avatar, AvatarImage, AvatarFallback } from "../avatar";

describe("Avatar", () => {
  it("renders fallback when no image src", async () => {
    render(
      <Avatar>
        <AvatarImage src="" alt="User" />
        <AvatarFallback>AB</AvatarFallback>
      </Avatar>,
    );
    // Fallback renders when image fails/is empty
    expect(await screen.findByText("AB")).toBeInTheDocument();
  });
});
