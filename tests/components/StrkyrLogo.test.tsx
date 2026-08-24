import { describe, it, expect } from "vitest";
import React from "react";
import { render } from "@testing-library/react";
import { StrkyrLogo } from "@/components/StrkyrLogo";

describe("StrkyrLogo Nordic Strength Logo Component", () => {
  it("should render Nordic strength vector SVG mark with correct dimensions", () => {
    const { container } = render(<StrkyrLogo size={64} />);
    const svg = container.querySelector("svg");
    expect(svg).toBeDefined();
    expect(svg?.getAttribute("width")).toBe("64");
    expect(svg?.getAttribute("height")).toBe("64");
  });

  it("should render with wordmark and subtitle when withText is true", () => {
    const { getByText } = render(<StrkyrLogo size={48} withText={true} subtitle="COACH STUDIO" />);
    expect(getByText("STRKYR")).toBeDefined();
    expect(getByText("COACH STUDIO")).toBeDefined();
  });
});
