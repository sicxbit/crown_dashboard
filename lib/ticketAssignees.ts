export const ASSIGNEE_DIRECTORY: Record<string, string> = {
  jemond: "Jemond (CEO)",
  natasha: "Natasha (HR Head)",
  jithu: "Jithu (Tech Head)",
  janice: "Janice (Onboarding & Accounts)",
};

export function formatAssigneeName(assigneeId: string) {
  return ASSIGNEE_DIRECTORY[assigneeId] ?? assigneeId ?? "Unknown";
}
