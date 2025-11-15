import type { EditableTemplate } from "@/lib/types/dashboard-template";

/**
 * Template model for MongoDB
 * Stores custom templates created by users
 */
export interface TemplateDocument extends Omit<EditableTemplate, "updatedAt"> {
  _id?: string;
  userId?: string; // Clerk user ID (when integrated, FASE 2)
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Convert EditableTemplate to TemplateDocument
 */
export function templateToDocument(
  template: EditableTemplate,
  userId?: string
): Omit<TemplateDocument, "_id" | "createdAt" | "updatedAt"> {
  return {
    ...template,
    userId,
  };
}

/**
 * Convert TemplateDocument to EditableTemplate
 */
export function templateDocumentToTemplate(doc: TemplateDocument): EditableTemplate {
  return {
    ...doc,
    updatedAt: doc.updatedAt.toISOString(),
  };
}

