import { GET as getTickets, POST as createTicket } from "@/app/api/tickets/route";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { routeTicket } from "@/lib/ticketRouting";

jest.mock("@/lib/auth", () => ({
  getCurrentUser: jest.fn(),
}));

jest.mock("@/lib/prisma", () => ({
  __esModule: true,
  default: {
    ticket: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
  },
}));

jest.mock("@/lib/ticketRouting", () => ({
  routeTicket: jest.fn(),
}));

type MockUser = {
  id: string;
  role: "admin" | "caregiver";
  caregiverId?: string | null;
};

const setCurrentUser = (user: MockUser | null) => {
  (getCurrentUser as jest.Mock).mockResolvedValue(user);
};

describe("tickets API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("requires authentication for GET", async () => {
    setCurrentUser(null);
    const response = await getTickets();
    expect(response.status).toBe(401);
  });

  it("filters ticket queries by role", async () => {
    const sampleTicket = {
      id: "t1",
      title: "Issue",
      description: "Details",
      status: "open",
      priority: "medium",
      assignedTo: "jithu",
      assignedReason: "reason",
      category: "Tech",
      createdAt: new Date("2024-01-01"),
      updatedAt: new Date("2024-01-02"),
      createdBy: {
        id: "u-admin",
        role: "admin",
        email: "admin@example.com",
        caregiver: null,
      },
    } as any;

    (prisma.ticket.findMany as jest.Mock).mockResolvedValue([sampleTicket]);

    setCurrentUser({ id: "admin-1", role: "admin" });
    await getTickets();
    expect(prisma.ticket.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: {} })
    );

    jest.clearAllMocks();
    (prisma.ticket.findMany as jest.Mock).mockResolvedValue([sampleTicket]);
    setCurrentUser({ id: "caregiver-1", role: "caregiver", caregiverId: "c1" });
    await getTickets();
    expect(prisma.ticket.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { createdByUserId: "caregiver-1" } })
    );
  });

  it("rejects invalid ticket payloads", async () => {
    setCurrentUser({ id: "user-1", role: "caregiver" });
    const request = new Request("http://localhost/api/tickets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: 123 }),
    });

    const response = await createTicket(request);
    expect(response.status).toBe(400);
  });

  it("creates a ticket with routed assignment", async () => {
    setCurrentUser({ id: "user-1", role: "caregiver" });
    (routeTicket as jest.Mock).mockResolvedValue({
      assignee: "janice",
      category: "Onboarding",
      reason: "LLM matched onboarding",
      source: "ai",
    });

    (prisma.ticket.create as jest.Mock).mockResolvedValue({
      id: "ticket-1",
      title: "Portal down",
      description: "Cannot login",
      status: "open",
      priority: "high",
      assignedTo: "janice",
      assignedReason: "LLM matched onboarding",
      category: "Onboarding",
      createdAt: new Date("2024-01-01"),
      updatedAt: new Date("2024-01-02"),
      createdBy: {
        id: "user-1",
        email: "care@example.com",
        role: "caregiver",
        caregiver: { firstName: "Care", lastName: "Giver" },
      },
    });

    const request = new Request("http://localhost/api/tickets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "Portal down",
        description: "Cannot login",
        priority: "high",
      }),
    });

    const response = await createTicket(request);
    const payload = await response.json();

    expect(response.status).toBe(201);
    expect(payload.ticket.assignedTo).toBe("janice");
    expect(routeTicket).toHaveBeenCalled();
  });
});
