import OpenAI from "openai";

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

type ResponsesCreatePayload = {
  model: string;
  input: Array<
    | { role: "system"; content: string }
    | { role: "user"; content: string }
  >;
};

type ResponsesApiJson = {
  output_text?: string;
  output?: Array<{
    content?: Array<{
      text?: string;
    }>;
  }>;
};

function createOpenAiClient(): OpenAI | null {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  try {
    return new OpenAI({ apiKey });
  } catch (error: unknown) {
    console.error("OpenAI SDK is not available", error);
    return null;
  }
}

function extractResponseText(value: unknown): string {
  if (!value || typeof value !== "object") return "";

  // Prefer output_text
  if ("output_text" in value && typeof (value as { output_text?: unknown }).output_text === "string") {
    return (value as { output_text: string }).output_text;
  }

  // Fallback shape: output[0].content[0].text
  if ("output" in value && Array.isArray((value as { output?: unknown }).output)) {
    const out0 = (value as { output: unknown[] }).output[0];
    if (out0 && typeof out0 === "object" && "content" in out0 && Array.isArray((out0 as { content?: unknown }).content)) {
      const c0 = (out0 as { content: unknown[] }).content[0];
      if (c0 && typeof c0 === "object" && "text" in c0 && typeof (c0 as { text?: unknown }).text === "string") {
        return (c0 as { text: string }).text;
      }
    }
  }

  return "";
}

async function callOpenAi(prompt: string): Promise<string | null> {
  const client = createOpenAiClient();
  if (!client) return null;

  const payload: ResponsesCreatePayload = {
    model: "gpt-4o-mini",
    input: [
      { role: "system", content: ROUTING_SYSTEM_PROMPT },
      { role: "user", content: prompt },
    ],
  };

  // Preferred path: OpenAI SDK (Responses API)
  const maybeResponses = (client as unknown as { responses?: { create?: (p: ResponsesCreatePayload) => Promise<unknown> } }).responses;
  if (maybeResponses?.create) {
    const respUnknown = await maybeResponses.create(payload);
    const text = extractResponseText(respUnknown);
    return text.trim() ? text.trim() : null;
  }

  // Fallback: direct HTTP call
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

  const json: unknown = await apiResponse.json().catch(() => null);
  const safeJson = (json ?? {}) as ResponsesApiJson;
  const text = safeJson.output_text ?? safeJson.output?.[0]?.content?.[0]?.text ?? "";
  return String(text).trim() ? String(text).trim() : null;
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

function parseRoutingResponse(responseText: string): Omit<RouteTicketResult, "source"> | null {
  try {
    const parsed: unknown = JSON.parse(responseText);
    if (!parsed || typeof parsed !== "object") return null;

    const obj = parsed as Record<string, unknown>;
    const assignee = obj.assignee;
    const category = obj.category;
    const reason = obj.reason;

    if (typeof assignee !== "string" || typeof category !== "string" || typeof reason !== "string") {
      return null;
    }

    if (!ASSIGNEE_VALUES.has(assignee as RouteTicketResult["assignee"])) return null;
    if (!CATEGORY_VALUES.has(category as RouteTicketResult["category"])) return null;

    const cleanedReason = reason.trim();
    if (!cleanedReason) return null;

    return {
      assignee: assignee as RouteTicketResult["assignee"],
      category: category as RouteTicketResult["category"],
      reason: cleanedReason,
    };
  } catch (error: unknown) {
    console.error("Failed to parse routing response", error);
    return null;
  }
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
    if (!responseText) return fallback;

    const parsed = parseRoutingResponse(responseText);
    if (!parsed) return fallback;

    return { ...parsed, source: "ai" };
  } catch (error: unknown) {
    console.error("Failed to route ticket via LLM", error);
    return fallback;
  }
}
