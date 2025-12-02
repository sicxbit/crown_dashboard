import { GET as getCaregivers, POST as createCaregiver } from "@/app/api/admin/caregivers/route";
import { requireApiUserRole } from "@/lib/auth";
import prisma from "@/lib/prisma";

jest.mock("@/lib/auth", () => ({
  requireApiUserRole: jest.fn(),
}));

jest.mock("@/lib/prisma", () => ({
  __esModule: true,
  default: {
    caregiver: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
  },
}));

describe("admin caregivers API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("requires admin role for GET", async () => {
    (requireApiUserRole as jest.Mock).mockRejectedValue(new Error("Unauthorized"));
    const response = await getCaregivers();
    expect(response.status).toBe(401);
  });

  it("returns caregiver summary", async () => {
    (requireApiUserRole as jest.Mock).mockResolvedValue({ id: "admin", role: "admin" });
    const now = new Date();
    (prisma.caregiver.findMany as jest.Mock).mockResolvedValue([
      {
        id: "c1",
        firstName: "Alex",
        lastName: "Doe",
        city: "Boston",
        state: "MA",
        status: "active",
        employeeCode: "E-1",
        sandataEvvId: null,
        compliance: [
          { status: "valid", expirationDate: new Date(now.getTime() + 1000 * 60 * 60 * 24 * 10) },
        ],
      },
    ]);

    const response = await getCaregivers();
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload[0].id).toBe("c1");
    expect(payload[0].complianceSummary).toBe("All valid");
  });

  it("validates required fields on POST", async () => {
    (requireApiUserRole as jest.Mock).mockResolvedValue({ id: "admin", role: "admin" });
    const request = new Request("http://localhost/api/admin/caregivers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ firstName: "Alex" }),
    });

    const response = await createCaregiver(request);
    expect(response.status).toBe(400);
  });

  it("creates caregivers for admins", async () => {
    (requireApiUserRole as jest.Mock).mockResolvedValue({ id: "admin", role: "admin" });
    (prisma.caregiver.create as jest.Mock).mockResolvedValue({ id: "c-new" });

    const request = new Request("http://localhost/api/admin/caregivers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ firstName: "Alex", lastName: "Doe", status: "active" }),
    });

    const response = await createCaregiver(request);
    const payload = await response.json();

    expect(response.status).toBe(201);
    expect(payload.id).toBe("c-new");
  });
});
