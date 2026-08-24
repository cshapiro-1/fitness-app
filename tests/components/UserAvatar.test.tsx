import { describe, it, expect } from "vitest";
import React from "react";
import { render, screen } from "@testing-library/react";
import { UserAvatar } from "@/components/UserAvatar";

describe("UserAvatar Component", () => {
  it("renders image tag when valid src is provided", () => {
    render(<UserAvatar src="https://example.com/avatar.jpg" name="Collin Shapiro" size={40} />);
    const img = screen.getByRole("img");
    expect(img).toBeDefined();
    expect(img.getAttribute("src")).toBe("https://example.com/avatar.jpg");
    expect(img.getAttribute("alt")).toBe("Collin Shapiro");
  });

  it("renders stylish initial fallback when src is null or undefined", () => {
    render(<UserAvatar src={null} name="Collin Shapiro" size={36} />);
    expect(screen.getByText("C")).toBeDefined();
  });

  it("renders default fallback initial 'U' when name is empty", () => {
    render(<UserAvatar src={null} name="" size={32} />);
    expect(screen.getByText("U")).toBeDefined();
  });
});
