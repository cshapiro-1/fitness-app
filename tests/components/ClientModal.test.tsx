import { describe, it, expect, vi } from "vitest";
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ClientModal } from "@/app/dashboard/components/ClientModal";

describe("ClientModal Component", () => {
  it("should not render when isOpen is false", () => {
    const { container } = render(
      <ClientModal
        isOpen={false}
        mode="add"
        onClose={vi.fn()}
        onSave={vi.fn()}
      />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("should render Add Client form fields correctly", () => {
    render(
      <ClientModal
        isOpen={true}
        mode="add"
        onClose={vi.fn()}
        onSave={vi.fn()}
      />
    );

    expect(screen.getByText("Add New Client")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("e.g. Sarah Connor")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("e.g. sarah@example.com")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("e.g. (555) 234-5678")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Add Client/i })).toBeInTheDocument();
  });

  it("should prefill values when in edit mode", () => {
    const mockClient = {
      id: "client-123",
      name: "Marcus Aurelius",
      image: "https://example.com/marcus.jpg",
      email: "marcus@rome.gov",
      phone: "555-0199",
      fitnessGoals: "Increase stoic endurance",
      notes: "Morning sessions only",
      createdAt: "2026-08-01T00:00:00Z",
      inviteStatus: "NOT_SENT" as const,
    };

    render(
      <ClientModal
        isOpen={true}
        mode="edit"
        client={mockClient}
        onClose={vi.fn()}
        onSave={vi.fn()}
      />
    );

    expect(screen.getByText("Edit Client: Marcus Aurelius")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Marcus Aurelius")).toBeInTheDocument();
    expect(screen.getByDisplayValue("marcus@rome.gov")).toBeInTheDocument();
    expect(screen.getByDisplayValue("555-0199")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Increase stoic endurance")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Save Changes/i })).toBeInTheDocument();
  });

  it("should trigger onSave callback on valid submit", async () => {
    const onSaveMock = vi.fn().mockResolvedValue(undefined);
    const onCloseMock = vi.fn();

    render(
      <ClientModal
        isOpen={true}
        mode="add"
        onClose={onCloseMock}
        onSave={onSaveMock}
      />
    );

    const nameInput = screen.getByPlaceholderText("e.g. Sarah Connor");
    fireEvent.change(nameInput, { target: { value: "John Connor" } });

    const submitBtn = screen.getByRole("button", { name: /Add Client/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(onSaveMock).toHaveBeenCalledWith({
        name: "John Connor",
        image: null,
        email: null,
        phone: null,
        fitnessGoals: null,
        notes: null,
        emailNotifications: true,
      });
      expect(onCloseMock).toHaveBeenCalled();
    });
  });
});
