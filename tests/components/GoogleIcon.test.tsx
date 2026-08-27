import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { GoogleIcon } from "@/components/GoogleIcon";

describe("GoogleIcon Component", () => {
  it("should render an SVG element with role=img and aria-label", () => {
    render(<GoogleIcon size={24} />);

    const svg = screen.getByRole("img", { name: /Google logo/i });
    expect(svg).toBeDefined();
    expect(svg.getAttribute("width")).toBe("24");
    expect(svg.getAttribute("height")).toBe("24");
    expect(svg.getAttribute("xmlns")).toBe("http://www.w3.org/2000/svg");
  });
});
