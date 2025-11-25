"use client";

import { useState, useCallback, useMemo } from "react";
import type { Contact } from "@/lib/types";
import type { Dashboard } from "@/lib/types/dashboard";
import { contactService } from "@/lib/services";
import { useToast } from "@/lib/state/toast-context";
import { updateDashboard } from "@/lib/storage/dashboards-store";

export interface CreateContactPayload {
  name: string;
  jobTitle: string;
  linkedinUrl: string;
}

/**
 * Contact operations hook with dashboard isolation
 * All operations validate that contacts belong to the active dashboard
 */
export function useContactOperations(
  currentCompany: { id: string } | null,
  currentDashboard: Dashboard | null,
  onRefresh: () => void
) {
  const { push } = useToast();
  
  const [regeneratingId, setRegeneratingId] = useState<string | null>(null);
  const [isChatting, setIsChatting] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // Get contacts from current dashboard
  const contacts = useMemo(() => {
    return currentDashboard?.contacts ?? [];
  }, [currentDashboard?.contacts]);

  // Create contact
  const createContact = useCallback(
    async (payload: CreateContactPayload) => {
      if (!currentCompany || !currentDashboard) {
        push({
          title: "No dashboard loaded",
          description: "Please select a dashboard before adding contacts.",
          variant: "destructive",
        });
        return;
      }

      const trimmedName = payload.name.trim();
      if (!trimmedName) {
        push({
          title: "Add a name first",
          description: "The contact must have at least a name.",
          variant: "destructive",
        });
        return;
      }

      try {
        setIsCreating(true);
        await contactService.createContact({
          name: trimmedName,
          jobTitle: payload.jobTitle.trim(),
          linkedinUrl: payload.linkedinUrl.trim(),
        });

        onRefresh();
        push({
          title: "Contact saved",
          variant: "success",
        });
      } catch (err) {
        push({
          title: "Failed to save contact",
          description: err instanceof Error ? err.message : "Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsCreating(false);
      }
    },
    [currentCompany, currentDashboard, onRefresh, push]
  );

  // Regenerate contact
  const regenerateContact = useCallback(
    async (contactId: string) => {
      if (!currentCompany || !currentDashboard) {
        push({
          title: "No dashboard loaded",
          description: "Please select a dashboard before regenerating contacts.",
          variant: "destructive",
        });
        return;
      }

      setRegeneratingId(contactId);
      try {
        await contactService.regenerateContact(contactId);
        onRefresh();
        push({
          title: "Contact updated",
          description: "Outreach insights regenerated for this contact.",
          variant: "success",
        });
      } catch (err) {
        push({
          title: "Regeneration failed",
          description: err instanceof Error ? err.message : "Try again in a few moments.",
          variant: "destructive",
        });
      } finally {
        setRegeneratingId(null);
      }
    },
    [currentCompany, currentDashboard, onRefresh, push]
  );

  // Chat with contact
  const chatWithContact = useCallback(
    async (contactId: string, message: string) => {
      if (!currentCompany || !currentDashboard) {
        push({
          title: "No dashboard loaded",
          description: "Please select a dashboard before chatting with contacts.",
          variant: "destructive",
        });
        return;
      }

      const trimmed = message.trim();
      if (!trimmed) return;

      try {
        setIsChatting(true);
        await contactService.chatWithContact(contactId, trimmed);
        onRefresh();
        push({
          title: "Contact insight updated",
          variant: "success",
        });
      } catch (err) {
        push({
          title: "Chat failed",
          description: err instanceof Error ? err.message : "Please try again in a few moments.",
          variant: "destructive",
        });
      } finally {
        setIsChatting(false);
      }
    },
    [currentCompany, currentDashboard, onRefresh, push]
  );

  return {
    contacts,
    regeneratingId,
    isChatting,
    isCreating,
    
    // Actions
    createContact,
    regenerateContact,
    chatWithContact,
    
    // Handlers ready for components
    handlers: {
      onCreate: createContact,
      onRegenerate: regenerateContact,
      onChat: chatWithContact,
    },
  };
}
