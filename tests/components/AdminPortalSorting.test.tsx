import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { AdminPortal } from "@/app/admin/AdminPortal";

describe("AdminPortal Table Sorting at the Top", () => {
  const mockTrainers = [
    {
      id: "t-1",
      name: "Bob Builder",
      email: "bob@builder.com",
      image: null,
      role: "TRAINER" as const,
      isAdmin: false,
      isInternalAdmin: false,
      subscriptionStatus: "active",
      computedStatus: "active" as const,
      trialEndsAt: null,
      subscribedUntil: "2027-01-01",
      createdAt: "2026-01-10T00:00:00Z",
      clientCount: 5,
      workoutsLoggedForClients: 50,
      lastLoginAt: "2026-09-01T00:00:00Z",
      lastActiveAt: "2026-09-01T00:00:00Z",
      lastSessionDurationSeconds: 120,
      loginCount: 15,
      totalSessionSeconds: 1800,
      avgSessionDurationSeconds: 120,
    },
    {
      id: "t-2",
      name: "Alice Adams",
      email: "alice@adams.com",
      image: null,
      role: "TRAINER" as const,
      isAdmin: false,
      isInternalAdmin: false,
      subscriptionStatus: "trialing",
      computedStatus: "trial" as const,
      trialEndsAt: "2026-10-01",
      subscribedUntil: null,
      createdAt: "2026-03-15T00:00:00Z",
      clientCount: 12,
      workoutsLoggedForClients: 150,
      lastLoginAt: "2026-09-10T00:00:00Z",
      lastActiveAt: "2026-09-10T00:00:00Z",
      lastSessionDurationSeconds: 300,
      loginCount: 40,
      totalSessionSeconds: 12000,
      avgSessionDurationSeconds: 300,
    },
    {
      id: "t-3",
      name: "Charlie Clark",
      email: "charlie@clark.com",
      image: null,
      role: "TRAINER" as const,
      isAdmin: false,
      isInternalAdmin: false,
      subscriptionStatus: "canceled",
      computedStatus: "expired" as const,
      trialEndsAt: null,
      subscribedUntil: null,
      createdAt: "2026-02-01T00:00:00Z",
      clientCount: 1,
      workoutsLoggedForClients: 10,
      lastLoginAt: "2026-08-01T00:00:00Z",
      lastActiveAt: "2026-08-01T00:00:00Z",
      lastSessionDurationSeconds: 60,
      loginCount: 5,
      totalSessionSeconds: 300,
      avgSessionDurationSeconds: 60,
    },
  ];

  const mockClients = [
    {
      id: "c-1",
      name: "David Miller",
      email: "david@client.com",
      phone: "555-1111",
      image: null,
      createdAt: "2026-02-15T00:00:00Z",
      trainerName: "Bob Builder",
      workoutsLogged: 25,
      isRegistered: true,
      isInternalAdmin: false,
      lastLoginAt: "2026-09-05T00:00:00Z",
      lastActiveAt: "2026-09-05T00:00:00Z",
      lastSessionDurationSeconds: 180,
      loginCount: 10,
      totalSessionSeconds: 1800,
      avgSessionDurationSeconds: 180,
    },
    {
      id: "c-2",
      name: "Chloe Smith",
      email: "chloe@client.com",
      phone: "555-2222",
      image: null,
      createdAt: "2026-04-01T00:00:00Z",
      trainerName: "Alice Adams",
      workoutsLogged: 80,
      isRegistered: true,
      isInternalAdmin: false,
      lastLoginAt: "2026-09-12T00:00:00Z",
      lastActiveAt: "2026-09-12T00:00:00Z",
      lastSessionDurationSeconds: 400,
      loginCount: 30,
      totalSessionSeconds: 12000,
      avgSessionDurationSeconds: 400,
    },
    {
      id: "c-3",
      name: "Edward Norton",
      email: "edward@client.com",
      phone: "555-3333",
      image: null,
      createdAt: "2026-01-05T00:00:00Z",
      trainerName: "Charlie Clark",
      workoutsLogged: 5,
      isRegistered: false,
      isInternalAdmin: false,
      lastLoginAt: null,
      lastActiveAt: null,
      lastSessionDurationSeconds: 0,
      loginCount: 1,
      totalSessionSeconds: 0,
      avgSessionDurationSeconds: 0,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes("/api/admin/stats")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            stats: {
              totalUsers: 6,
              totalTrainers: 3,
              totalClients: 3,
              totalWorkouts: 210,
              activeSubscriptions: 1,
              trialingUsers: 1,
              expiredUsers: 1,
              estimatedMRR: 19,
              conversionRate: 33,
            },
            trainers: mockTrainers,
            clients: mockClients,
            billing: { connected: false },
          }),
        } as any);
      }
      if (url.includes("/api/admin/anatomy")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ exercises: [], summary: {} }),
        } as any);
      }
      return Promise.resolve({ ok: true, json: async () => ({}) } as any);
    });
  });

  it("should render Trainers table with sort controls and default to Joined Date desc", async () => {
    render(<AdminPortal userName="Admin" />);

    expect(await screen.findByText("Alice Adams")).toBeInTheDocument();
    expect(screen.getByText("Bob Builder")).toBeInTheDocument();
    expect(screen.getByText("Charlie Clark")).toBeInTheDocument();

    // In joined date desc order:
    // 1. Alice Adams (2026-03-15)
    // 2. Charlie Clark (2026-02-01)
    // 3. Bob Builder (2026-01-10)
    const rows = screen.getAllByRole("row");
    expect(rows[1]).toHaveTextContent("Alice Adams");
    expect(rows[2]).toHaveTextContent("Charlie Clark");
    expect(rows[3]).toHaveTextContent("Bob Builder");
  });

  it("should sort trainers by name ascending when Trainer header is clicked", async () => {
    render(<AdminPortal userName="Admin" />);

    expect(await screen.findByText("Alice Adams")).toBeInTheDocument();

    const trainerTh = screen.getByRole("columnheader", { name: /trainer/i });
    fireEvent.click(trainerTh);

    const rows = screen.getAllByRole("row");
    // Ascending: Alice Adams -> Bob Builder -> Charlie Clark
    expect(rows[1]).toHaveTextContent("Alice Adams");
    expect(rows[2]).toHaveTextContent("Bob Builder");
    expect(rows[3]).toHaveTextContent("Charlie Clark");

    // Click again to toggle descending: Charlie Clark -> Bob Builder -> Alice Adams
    fireEvent.click(trainerTh);
    const rowsDesc = screen.getAllByRole("row");
    expect(rowsDesc[1]).toHaveTextContent("Charlie Clark");
    expect(rowsDesc[2]).toHaveTextContent("Bob Builder");
    expect(rowsDesc[3]).toHaveTextContent("Alice Adams");
  });

  it("should sort trainers by workouts logged (descending by default on first click)", async () => {
    render(<AdminPortal userName="Admin" />);

    expect(await screen.findByText("Alice Adams")).toBeInTheDocument();

    const workoutsTh = screen.getByRole("columnheader", { name: /workouts logged/i });
    fireEvent.click(workoutsTh);

    const rows = screen.getAllByRole("row");
    // Workouts logged desc: Alice (150) -> Bob (50) -> Charlie (10)
    expect(rows[1]).toHaveTextContent("Alice Adams");
    expect(rows[2]).toHaveTextContent("Bob Builder");
    expect(rows[3]).toHaveTextContent("Charlie Clark");

    // Click again to toggle ascending: Charlie (10) -> Bob (50) -> Alice (150)
    fireEvent.click(workoutsTh);
    const rowsAsc = screen.getAllByRole("row");
    expect(rowsAsc[1]).toHaveTextContent("Charlie Clark");
    expect(rowsAsc[2]).toHaveTextContent("Bob Builder");
    expect(rowsAsc[3]).toHaveTextContent("Alice Adams");
  });

  it("should sort trainers using the top toolbar Sort dropdown selector", async () => {
    render(<AdminPortal userName="Admin" />);

    expect(await screen.findByText("Alice Adams")).toBeInTheDocument();

    const sortSelect = screen.getByLabelText("Sort trainers table by");
    fireEvent.change(sortSelect, { target: { value: "clientCount" } });

    const rows = screen.getAllByRole("row");
    // Client count desc by default: Alice (12) -> Bob (5) -> Charlie (1)
    expect(rows[1]).toHaveTextContent("Alice Adams");
    expect(rows[2]).toHaveTextContent("Bob Builder");
    expect(rows[3]).toHaveTextContent("Charlie Clark");

    // Toggle direction button in toolbar
    const dirBtn = screen.getByLabelText(/sort direction/i);
    fireEvent.click(dirBtn);

    const rowsAsc = screen.getAllByRole("row");
    // Ascending: Charlie (1) -> Bob (5) -> Alice (12)
    expect(rowsAsc[1]).toHaveTextContent("Charlie Clark");
    expect(rowsAsc[2]).toHaveTextContent("Bob Builder");
    expect(rowsAsc[3]).toHaveTextContent("Alice Adams");
  });

  it("should sort Clients table by name and workouts logged via headers and toolbar", async () => {
    render(<AdminPortal userName="Admin" />);

    // Switch to Clients tab
    const clientsTabBtn = screen.getByRole("button", { name: /clients & athletes/i });
    fireEvent.click(clientsTabBtn);

    expect(await screen.findByText("David Miller")).toBeInTheDocument();
    expect(screen.getByText("Chloe Smith")).toBeInTheDocument();
    expect(screen.getByText("Edward Norton")).toBeInTheDocument();

    // Default: Account Created desc
    // Chloe (2026-04-01) -> David (2026-02-15) -> Edward (2026-01-05)
    let rows = screen.getAllByRole("row");
    expect(rows[1]).toHaveTextContent("Chloe Smith");
    expect(rows[2]).toHaveTextContent("David Miller");
    expect(rows[3]).toHaveTextContent("Edward Norton");

    // Click "Client / Athlete" header to sort by name asc
    const clientTh = screen.getByRole("columnheader", { name: /client \/ athlete/i });
    fireEvent.click(clientTh);

    rows = screen.getAllByRole("row");
    // Chloe Smith -> David Miller -> Edward Norton
    expect(rows[1]).toHaveTextContent("Chloe Smith");
    expect(rows[2]).toHaveTextContent("David Miller");
    expect(rows[3]).toHaveTextContent("Edward Norton");

    // Click again for name desc: Edward Norton -> David Miller -> Chloe Smith
    fireEvent.click(clientTh);
    rows = screen.getAllByRole("row");
    expect(rows[1]).toHaveTextContent("Edward Norton");
    expect(rows[2]).toHaveTextContent("David Miller");
    expect(rows[3]).toHaveTextContent("Chloe Smith");

    // Sort by Workouts Logged using client top toolbar
    const clientSortSelect = screen.getByLabelText("Sort clients table by");
    fireEvent.change(clientSortSelect, { target: { value: "workoutsLogged" } });

    rows = screen.getAllByRole("row");
    // Workouts logged desc: Chloe (80) -> David (25) -> Edward (5)
    expect(rows[1]).toHaveTextContent("Chloe Smith");
    expect(rows[2]).toHaveTextContent("David Miller");
    expect(rows[3]).toHaveTextContent("Edward Norton");
  });
});
