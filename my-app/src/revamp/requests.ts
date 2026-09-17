import { Draft, LeadStatus } from "./model";
import { getMetaBrowserIds, getStoredUtm } from "./pixel";

export interface RequestReceipt { id: string; createdAt: string; status: LeadStatus }

function attribution() {
  return {
    utm: getStoredUtm(),
    ...getMetaBrowserIds(),
    sourceUrl: window.location.href,
  };
}

export async function submitRequest(draft: Draft): Promise<RequestReceipt> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);
  try {
    const response = await fetch("/api/requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ draft, ...attribution() }),
      signal: controller.signal,
    });
    const body = await response.json().catch(() => null);
    if (!response.ok) {
      throw new Error(body?.error || "We could not send your request. Please try again.");
    }
    if (!body?.receipt?.id || !body.receipt.createdAt || !body.receipt.status) {
      throw new Error("We could not confirm your request. Please try again; you will not create a duplicate.");
    }
    return body.receipt;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("The connection timed out. Please try again; you will not create a duplicate.");
    }
    if (error instanceof TypeError) {
      throw new Error("Please check your connection and try again. Your answers are still here.");
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

// Saves a partial lead (name + phone + ZIP + service type) as soon as the
// first step is completed, so an abandoned form still leaves someone to call.
export async function submitPartialRequest(draft: Draft): Promise<{ id: string }> {
  const response = await fetch("/api/requests/partial", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      draft: {
        id: draft.id,
        intent: draft.intent,
        zip: draft.zip,
        firstName: draft.firstName,
        lastName: draft.lastName,
        phone: draft.phone,
        email: draft.email,
      },
      ...attribution(),
    }),
  });
  const body = await response.json().catch(() => null);
  if (!response.ok || !body?.receipt?.id) {
    throw new Error(body?.error || "Partial lead could not be saved.");
  }
  return body.receipt;
}
