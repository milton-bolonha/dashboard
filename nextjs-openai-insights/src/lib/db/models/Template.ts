import type { Document } from "mongodb";
import type { EditableTemplate } from "@/lib/types/dashboard-template";

/**
 * Template model for MongoDB
 * Stores custom templates created by users
 * Best practice: Extends Document for MongoDB compatibility
 */
export interface TemplateDocument extends Document, Omit<EditableTemplate, "createdAt" | "updatedAt"> {
  _id?: string;
  userId?: string; // Clerk user ID (when integrated, FASE 2)
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Convert EditableTemplate to TemplateDocument
 * Best practice: Validate input before conversion
 */
export function templateToDocument(
  template: EditableTemplate,
  userId?: string
): Omit<TemplateDocument, "_id" | "createdAt" | "updatedAt"> {
  if (!template || !template.id) {
    throw new Error("Invalid template: missing id");
  }
  if (!template.name || template.name.trim().length === 0) {
    throw new Error("Invalid template: name cannot be empty");
  }

  return {
    ...template,
    userId,
  };
}

/**
 * Convert TemplateDocument to EditableTemplate
 * Best practice: Validate and handle Date conversion safely
 */
export function templateDocumentToTemplate(doc: TemplateDocument): EditableTemplate {
  if (!doc || !doc.id) {
    throw new Error("Invalid TemplateDocument: missing id");
  }

  const toISOString = (date: Date | string): string => {
    if (date instanceof Date) {
      return date.toISOString();
    }
    return new Date(date).toISOString();
  };

  return {
    ...doc,
    createdAt: toISOString(doc.createdAt),
    updatedAt: toISOString(doc.updatedAt),
  };
}

