import type { Contact } from "@/lib/types";

/**
 * Contact model for MongoDB (standalone collection)
 * Used when contacts are stored separately from dashboards
 */
export interface ContactDocument extends Omit<Contact, "createdAt"> {
  _id?: string;
  dashboardId: string; // Reference to dashboard
  createdAt: Date;
}

/**
 * Convert Contact to ContactDocument
 */
export function contactToDocument(
  contact: Contact,
  dashboardId: string
): Omit<ContactDocument, "_id" | "createdAt"> {
  return {
    ...contact,
    dashboardId,
  };
}

/**
 * Convert ContactDocument to Contact
 */
export function contactDocumentToContact(doc: ContactDocument): Contact {
  return {
    ...doc,
    createdAt: doc.createdAt.toISOString(),
  };
}

