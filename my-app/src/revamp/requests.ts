import { Draft, LeadStatus } from "./model";

export interface RequestReceipt { id: string; createdAt: string; status: LeadStatus }

export async function submitRequest(draft: Draft): Promise<RequestReceipt> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);
  try {
    const response = await fetch("/api/requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ draft }),
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
