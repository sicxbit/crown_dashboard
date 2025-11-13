import { cookies } from "next/headers";
import { cache } from "react";
import { firebaseAdminAuth } from "./firebaseAdmin";
import prisma from "./prisma";

export type CurrentUser = {
  id: string;
  firebaseUid: string;
  email: string | null;
  role: "admin" | "caregiver";
  caregiverId: string | null;
  createdAt: Date;
  updatedAt: Date;
  caregiver?: {
    id: string;
    firstName: string;
    lastName: string;
    phone: string | null;
    email: string | null;
  } | null;
};

export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const sessionCookie = cookies().get("session");
  if (!sessionCookie?.value) {
    return null;
  }

  try {
    const decoded = await firebaseAdminAuth().verifySessionCookie(sessionCookie.value, true);
    const user = await prisma.user.findUnique({
      where: { firebaseUid: decoded.uid },
      include: {
        caregiver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            email: true,
          },
        },
      },
    });

    if (!user) {
      return null;
    }

    return {
      id: user.id,
      firebaseUid: user.firebaseUid,
      email: user.email,
      role: user.role as CurrentUser["role"],
      caregiverId: user.caregiverId,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      caregiver: user.caregiver,
    };
  } catch (error) {
    console.error("Failed to verify session cookie", error);
    return null;
  }
});

export async function requireApiUserRole(role: "admin" | "caregiver") {
  const user = await getCurrentUser();
  if (!user || user.role !== role) {
    throw new Error("Unauthorized");
  }
  return user;
}
