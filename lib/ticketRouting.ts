export type RouteTicketResult = {
  assignee: "jemond" | "natasha" | "jithu" | "janice";
  category: "HR" | "Tech" | "Exec" | "Onboarding";
  reason: string;
  source: "ai" | "fallback";
};

export { ASSIGNEE_DIRECTORY, formatAssigneeName } from "./ticketAssignees";

const ROUTING_SYSTEM_PROMPT = `You are a ticket routing assistant for CrownCaregivers.
Assign each ticket to exactly ONE of these four:
1. "jemond" – CEO: Escalations, legal issues, severe client complaints.
2. "natasha" – HR head: HR/payroll issues, staffing conflicts, recruitment.
3. "jithu" – tech head: Portal bugs, login issues, CRM/API errors.
4. "janice" – onboarding/accounts: onboarding, missing docs, billing, intake.

Return ONLY valid JSON:
{
  "assignee": "<one person>",
  "category": "<HR | Tech | Exec | Onboarding>",
  "reason": "<1–2 sentence explanation>"
}`;

async function createOpenAiClient() {
  try {
    const openaiModule = await import("openai");
    const OpenAI = (openaiModule as { default?: new (config: { apiKey: string }) => any }).default;
    if (!OpenAI) {
      return null;
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.error("OPENAI_API_KEY is not set");
      return null;
    }

    return new OpenAI({ apiKey });
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
  const payload = {
    model: "gpt-4o-mini",
    input: [
      { role: "system", content: ROUTING_SYSTEM_PROMPT },
      { role: "user", content: prompt },
    ],
  } as const;

  if (client?.responses?.create) {
    const response = await client.responses.create(payload);
    const outputText =
      (response as any)?.output_text ?? (response as any)?.output?.[0]?.content?.[0]?.text ?? "";
    return String(outputText).trim();
  }

  const apiResponse = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify(payload),
  });

  if (!apiResponse.ok) {
    throw new Error(`OpenAI API request failed with status ${apiResponse.status}`);
  }

  const json = (await apiResponse.json()) as {
    output_text?: string;
    output?: Array<{ content?: Array<{ text?: string }> }>;
  };
  const text = json.output_text ?? json.output?.[0]?.content?.[0]?.text ?? "";
  return String(text).trim();
}

const ASSIGNEE_VALUES = new Set<RouteTicketResult["assignee"]>([
  "jemond",
  "natasha",
  "jithu",
  "janice",
]);

const CATEGORY_VALUES = new Set<RouteTicketResult["category"]>([
  "HR",
  "Tech",
  "Exec",
  "Onboarding",
]);

function parseRoutingResponse(responseText: string) {
  try {
    const parsed = JSON.parse(responseText) as Partial<RouteTicketResult>;
    if (
      parsed &&
      typeof parsed.assignee === "string" &&
      typeof parsed.category === "string" &&
      typeof parsed.reason === "string" &&
      ASSIGNEE_VALUES.has(parsed.assignee as RouteTicketResult["assignee"]) &&
      CATEGORY_VALUES.has(parsed.category as RouteTicketResult["category"]) &&
      parsed.reason.trim().length > 0
    ) {
      return {
        assignee: parsed.assignee as RouteTicketResult["assignee"],
        category: parsed.category as RouteTicketResult["category"],
        reason: parsed.reason.trim(),
      } satisfies Omit<RouteTicketResult, "source">;
    }
  } catch (error) {
    console.error("Failed to parse routing response", error);
  }
  return null;
}

export async function routeTicket(title: string, description: string): Promise<RouteTicketResult> {
  const fallback: RouteTicketResult = {
    assignee: "jithu",
    category: "Tech",
    reason: "LLM routing failed — fallback",
    source: "fallback",
  };

  const userPrompt = `Ticket details:\nTitle: ${title}\nDescription: ${description}`;

  try {
    const responseText = await callOpenAi(userPrompt);
    if (!responseText) {
      return fallback;
    }

    const parsed = parseRoutingResponse(responseText);
    if (!parsed) {
      return fallback;
    }

    return { ...parsed, source: "ai" } satisfies RouteTicketResult;
  } catch (error) {
    console.error("Failed to route ticket via LLM", error);
    return fallback;
  }
}
