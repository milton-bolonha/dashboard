import type { Contact } from "@/lib/types";

/**
 * Service for contact API operations
 * Pure functions without React dependencies
 */

export interface CreateContactPayload {
  name: string;
  jobTitle: string;
  linkedinUrl: string;
}

export interface ContactServiceError extends Error {
  status?: number;
  data?: unknown;
}

/**
 * Create a new contact
 */
export async function createContact(
  payload: CreateContactPayload
): Promise<Contact> {
  const response = await fetch("/api/workspace/contacts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: payload.name.trim(),
      jobTitle: payload.jobTitle.trim(),
      linkedinUrl: payload.linkedinUrl.trim(),
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const error: ContactServiceError = new Error(
      (errorData.error as string) ?? "We couldn't save this contact right now."
    );
    error.status = response.status;
    error.data = errorData;
    throw error;
  }

  const data = await response.json();
  return data.contact as Contact;
}

/**
 * Regenerate contact insights
 */
export async function regenerateContact(contactId: string): Promise<Contact> {
  const response = await fetch(
    `/api/workspace/contacts/${contactId}/regenerate`,
    { method: "POST" }
  );

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    const error: ContactServiceError = new Error(
      (data.error as string) ?? "We couldn't refresh this contact now."
    );
    error.status = response.status;
    error.data = data;
    
    if (response.status === 404) {
      error.message = "Session expired";
    }
    
    throw error;
  }

  const responseData = await response.json();
  return responseData.contact as Contact;
}

/**
 * Chat with a contact
 */
export async function chatWithContact(
  contactId: string,
  message: string
): Promise<Contact> {
  const response = await fetch(`/api/workspace/contacts/${contactId}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: message.trim() }),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    const error: ContactServiceError = new Error(
      data.error ?? "Failed to generate follow-up insight"
    );
    error.status = response.status;
    error.data = data;
    
    if (response.status === 404) {
      error.message = "Session expired";
    }
    
    throw error;
  }

  const responseData = await response.json();
  return responseData.contact as Contact;
}
