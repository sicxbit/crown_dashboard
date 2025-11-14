import prisma from "@/lib/prisma";

export type TicketAssignmentMember = {
  id: string;
  name: string;
  role: string;
  skills: string[];
};

type RoleProfile = {
  roleLabel: string;
  skills: string[];
};

const ROLE_PROFILES: Record<string, RoleProfile> = {
  admin: {
    roleLabel: "Operations",
    skills: [
      "intake",
      "care coordination",
      "scheduling",
      "quality assurance",
      "compliance",
    ],
  },
  caregiver: {
    roleLabel: "Field Support",
    skills: [
      "care plans",
      "visit coverage",
      "timesheets",
      "incident follow-up",
      "training",
    ],
  },
};

function buildUserDisplayName(user: {
  email: string | null;
  role: string;
  caregiver?: {
    firstName: string;
    lastName: string;
  } | null;
}) {
  if (user.caregiver) {
    return `${user.caregiver.firstName} ${user.caregiver.lastName}`.trim();
  }
  if (user.email) {
    return user.email;
  }
  return user.role === "admin" ? "Administrator" : "Team Member";
}

export async function getTicketAssignmentMembers(): Promise<TicketAssignmentMember[]> {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "asc" },
    include: {
      caregiver: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
    },
  });

  return users.map((user) => {
    const profile = ROLE_PROFILES[user.role] ?? {
      roleLabel: "Support",
      skills: ["general inquiries", "follow-up", "escalations"],
    };

    return {
      id: user.id,
      name: buildUserDisplayName(user),
      role: profile.roleLabel,
      skills: profile.skills,
    } satisfies TicketAssignmentMember;
  });
}

export function findTeamMemberById(
  members: TicketAssignmentMember[],
  id: string | null | undefined
) {
  if (!id) {
    return undefined;
  }
  return members.find((member) => member.id === id);
}

export function getFallbackAssignee(members: TicketAssignmentMember[]) {
  if (members.length === 0) {
    return null;
  }

  const operationsLead = members.find((member) => member.role.includes("Operations"));
  return operationsLead ?? members[0];
}
