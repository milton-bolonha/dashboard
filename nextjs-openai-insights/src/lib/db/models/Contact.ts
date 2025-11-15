import type { Document } from "mongodb";
import type { Contact } from "@/lib/types";

/**
 * Contact model for MongoDB (standalone collection)
 * Used when contacts are stored separately from dashboards
 * Best practice: Extends Document for MongoDB compatibility
 */
export interface ContactDocument extends Document, Omit<Contact, "createdAt"> {
  _id?: string;
  dashboardId: string; // Reference to dashboard
  createdAt: Date;
}

/**
 * Convert Contact to ContactDocument
 * Best practice: Validate input before conversion
 */
export function contactToDocument(
  contact: Contact,
  dashboardId: string
): Omit<ContactDocument, "_id" | "createdAt"> {
  if (!contact || !contact.id) {
    throw new Error("Invalid contact: missing id");
  }
  if (!dashboardId) {
    throw new Error("Invalid dashboardId: cannot be empty");
  }

  return {
    ...contact,
    dashboardId,
  };
}

/**
 * Convert ContactDocument to Contact
 * Best practice: Validate and handle Date conversion safely
 */
export function contactDocumentToContact(doc: ContactDocument): Contact {
  if (!doc || !doc.id) {
    throw new Error("Invalid ContactDocument: missing id");
  }

  return {
    ...doc,
    createdAt:
      doc.createdAt instanceof Date
        ? doc.createdAt.toISOString()
        : new Date(doc.createdAt).toISOString(),
  };
}

