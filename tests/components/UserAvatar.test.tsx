import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { UserAvatar } from "@/components/UserAvatar";

describe("UserAvatar Component", () => {
  it("should render image immediately with no-referrer policy without CORS blockage when Google avatar URL is provided", () => {
    const googleUrl = "https://lh3.googleusercontent.com/a/ACg8ocL123456789=s96-c";
    render(<UserAvatar src={googleUrl} name="Collin Shapiro" size={40} />);

    const img = screen.getByRole("img");
    expect(img).toBeDefined();
    expect(img.getAttribute("src")).toBe(googleUrl);
    expect(img.getAttribute("referrerpolicy")).toBe("no-referrer");
    expect(img.getAttribute("crossorigin")).toBeNull();
  });

  it("should fallback to name initial if no image src is provided or if src is string literal 'null'", () => {
    const { unmount } = render(<UserAvatar src={null} name="Collin Shapiro" size={40} />);
    expect(screen.queryByRole("img")).toBeNull();
    expect(screen.getByText("C")).toBeDefined();
    unmount();

    render(<UserAvatar src="null" name="Collin Shapiro" size={40} />);
    expect(screen.queryByRole("img")).toBeNull();
    expect(screen.getByText("C")).toBeDefined();
  });

  it("should fallback to /api/user/avatar proxy if Google avatar encounters an error, then initial if proxy fails", () => {
    const googleUrl = "https://lh3.googleusercontent.com/a/ACg8ocBrokenUrl=s96-c";
    render(<UserAvatar src={googleUrl} name="Collin Shapiro" size={32} />);

    let img = screen.getByRole("img");
    expect(img.getAttribute("src")).toBe(googleUrl);

    // Simulate direct Google CDN network block
    fireEvent.error(img);

    // Should switch to server avatar proxy
    img = screen.getByRole("img");
    expect(img.getAttribute("src")).toBe("/api/user/avatar");

    // If proxy also fails, fallback to initial
    fireEvent.error(img);
    expect(screen.queryByRole("img")).toBeNull();
    expect(screen.getByText("C")).toBeDefined();
  });

  it("should fallback to initial if non-Google image throws an onError event", () => {
    const brokenUrl = "https://example.com/broken-image.jpg";
    render(<UserAvatar src={brokenUrl} name="Jose Dildine" size={32} />);

    const img = screen.getByRole("img");
    fireEvent.error(img);

    expect(screen.queryByRole("img")).toBeNull();
    expect(screen.getByText("J")).toBeDefined();
  });
});
