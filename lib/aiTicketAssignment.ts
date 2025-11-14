import { getFallbackAssignee, getTicketAssignmentMembers } from "@/lib/ticketAssignment";

type SuggestAssigneeResult = {
  assigneeId: string | null;
  source: "ai" | "fallback";
  members: Awaited<ReturnType<typeof getTicketAssignmentMembers>>;
};

async function createOpenAiClient() {
  try {
    // Dynamic import keeps the module optional in environments where it is not installed yet.
    const openaiModule = await import("openai");
    const OpenAI = (openaiModule as { default?: new (config: { apiKey: string }) => any }).default;
    if (!OpenAI) {
      return null;
    }
    return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  } catch (error) {
    console.error("OpenAI SDK is not available", error);
    return null;
  }
}

async function callOpenAi(prompt: string) {
  if (!process.env.OPENAI_API_KEY) {
    return null;
  }

  const client = await createOpenAiClient();
  if (client?.responses?.create) {
    const response = await client.responses.create({
      model: "gpt-5.1-mini",
      input: prompt,
    });
    const outputText =
      (response as any)?.output_text ??
      (response as any)?.output?.[0]?.content?.[0]?.text ??
      "";
    return String(outputText).trim();
  }

  // Fallback to direct fetch if the SDK could not be loaded.
  const apiResponse = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-5.1-mini",
      input: prompt,
    }),
  });

  if (!apiResponse.ok) {
    throw new Error(`OpenAI API request failed with status ${apiResponse.status}`);
  }

  const payload = (await apiResponse.json()) as { output_text?: string; output?: Array<{ content?: Array<{ text?: string }> }> };
  const text = payload.output_text ?? payload.output?.[0]?.content?.[0]?.text ?? "";
  return String(text).trim();
}

export async function getSuggestedTicketAssignee(
  title: string,
  description: string
): Promise<SuggestAssigneeResult> {
  const members = await getTicketAssignmentMembers();
  if (members.length === 0) {
    return { assigneeId: null, source: "fallback", members };
  }

  const memberList = members
    .map((member) => `${member.id} - ${member.name} (${member.role}): ${member.skills.join(", ")}`)
    .join("\n");

  const prompt = `You are routing internal support tickets for Crown Caregivers.\nChoose exactly ONE assignee ID from the list below.\n\nTeam members:\n${memberList}\n\nTicket:\nTitle: ${title}\nDescription: ${description}\n\nReturn ONLY the id of the best assignee, nothing else.`;

  try {
    const suggestion = await callOpenAi(prompt);
    if (!suggestion) {
      const fallback = getFallbackAssignee(members);
      return {
        assigneeId: fallback?.id ?? null,
        source: "fallback",
        members,
      };
    }

    const assigneeId = suggestion.split(/\s+/)[0];
    const exists = members.some((member) => member.id === assigneeId);
    if (!exists) {
      const fallback = getFallbackAssignee(members);
      return {
        assigneeId: fallback?.id ?? null,
        source: "fallback",
        members,
      };
    }

    return { assigneeId, source: "ai", members };
  } catch (error) {
    console.error("Failed to fetch OpenAI suggestion", error);
    const fallback = getFallbackAssignee(members);
    return {
      assigneeId: fallback?.id ?? null,
      source: "fallback",
      members,
    };
  }
}
