import { cookies } from "next/headers";
import { POST as createSession, DELETE as clearSession } from "@/app/api/auth/session/route";
import { GET as validateSession } from "@/app/api/auth/session/validate/route";
import { firebaseAdminAuth } from "@/lib/firebaseAdmin";
import prisma from "@/lib/prisma";

jest.mock("next/headers", () => ({
  cookies: jest.fn(),
}));

jest.mock("@/lib/firebaseAdmin", () => ({
  firebaseAdminAuth: jest.fn(),
}));

jest.mock("@/lib/prisma", () => ({
  __esModule: true,
  default: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    caregiver: {
      findFirst: jest.fn(),
    },
  },
}));

type MockCookies = ReturnType<typeof cookies>;

const mockAuth = {
  verifyIdToken: jest.fn(),
  createSessionCookie: jest.fn(),
  verifySessionCookie: jest.fn(),
};

const getCookieMock = () => cookies as jest.MockedFunction<typeof cookies>;

beforeEach(() => {
  jest.clearAllMocks();
  (firebaseAdminAuth as jest.Mock).mockReturnValue(mockAuth);
  mockAuth.verifyIdToken.mockReset();
  mockAuth.createSessionCookie.mockReset();
  mockAuth.verifySessionCookie.mockReset();
  getCookieMock().mockReturnValue({
    get: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
  } as unknown as MockCookies);
});

function createRequest(body: unknown) {
  return new Request("http://localhost/api/auth/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

it("rejects missing idToken payloads", async () => {
  const response = await createSession(createRequest({}));
  const payload = await response.json();

  expect(response.status).toBe(400);
  expect(payload.error).toMatch(/Missing idToken/i);
});

it("creates a caregiver session and sets cookie", async () => {
  const setMock = jest.fn();
  getCookieMock().mockReturnValue({
    get: jest.fn(),
    set: setMock,
    delete: jest.fn(),
  } as unknown as MockCookies);

  mockAuth.verifyIdToken.mockResolvedValue({ uid: "uid-1", phone_number: "+15551234567" });
  (prisma.caregiver.findFirst as jest.Mock).mockResolvedValue({ id: "caregiver-1", phone: "+15551234567" });
  (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
  (prisma.user.create as jest.Mock).mockResolvedValue({ id: "user-1", role: "caregiver" });
  mockAuth.createSessionCookie.mockResolvedValue("session-token");

  const response = await createSession(createRequest({ idToken: "valid-token" }));
  const payload = await response.json();

  expect(response.status).toBe(200);
  expect(payload.role).toBe("caregiver");
  expect(setMock).toHaveBeenCalledWith(
    expect.objectContaining({ name: "session", value: "session-token" })
  );
});

it("returns 401 on verification failure", async () => {
  mockAuth.verifyIdToken.mockRejectedValue(new Error("bad token"));

  const response = await createSession(createRequest({ idToken: "bad-token" }));
  expect(response.status).toBe(401);
});

it("validates an existing session", async () => {
  const getMock = jest.fn().mockReturnValue({ value: "session-cookie" });
  getCookieMock().mockReturnValue({
    get: getMock,
    set: jest.fn(),
    delete: jest.fn(),
  } as unknown as MockCookies);

  mockAuth.verifySessionCookie.mockResolvedValue({ uid: "uid-2" });
  (prisma.user.findUnique as jest.Mock).mockResolvedValue({
    id: "user-2",
    firebaseUid: "uid-2",
    email: "admin@example.com",
    role: "admin",
    caregiverId: null,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-02"),
    caregiver: null,
  });

  const response = await validateSession();
  const payload = await response.json();

  expect(response.status).toBe(200);
  expect(payload.role).toBe("admin");
  expect(mockAuth.verifySessionCookie).toHaveBeenCalledWith("session-cookie", true);
});

it("clears a session cookie", async () => {
  const deleteMock = jest.fn();
  getCookieMock().mockReturnValue({
    get: jest.fn(),
    set: jest.fn(),
    delete: deleteMock,
  } as unknown as MockCookies);

  const response = await clearSession();
  expect(response.status).toBe(200);
  expect(deleteMock).toHaveBeenCalledWith("session");
});
