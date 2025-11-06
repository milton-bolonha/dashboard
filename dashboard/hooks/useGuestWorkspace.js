"use client";

import { useMemo, useEffect, useState } from "react";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";

/**
 * Hook para gerenciar o workspace do guest
 * Isola a lógica de SWR, revalidação e derivações de dados
 */
export function useGuestWorkspace({ guestId, jobId, token }) {
  const swrKey = useMemo(() => {
    const buildKey = (params) => {
      const searchParams = new URLSearchParams(params);
      return `/api/guest/workspace?${searchParams.toString()}`;
    };

    if (jobId && guestId) {
      const params = {
        guest_id: guestId,
        job_id: jobId,
        _: Date.now().toString(),
      };
      if (token) {
        params.token = token;
      }
      return buildKey(params);
    }
    if (guestId) {
      return buildKey({
        guest_id: guestId,
        _: Date.now().toString(),
      });
    }
    return null;
  }, [guestId, jobId, token]);

  const {
    data,
    error,
    isLoading,
    mutate: revalidateWorkspace,
  } = useSWR(swrKey, fetcher, {
    // ⭐ CORREÇÃO: Desabilitar polling automático do SWR quando há jobId
    // O polling será gerenciado pelo useJobStreaming para evitar queries duplicadas
    refreshInterval: 0, // Desabilitado - useJobStreaming gerencia o polling
    revalidateOnFocus: true,
    dedupingInterval: 1000, // Cache de 1s para evitar queries simultâneas
  });

  const companies = useMemo(() => {
    if (!data) return [];
    if (Array.isArray(data.companies)) return data.companies;
    if (data.workspace?.companies) return data.workspace.companies;
    return [];
  }, [data]);

  const contacts = useMemo(() => {
    if (!data) return [];
    if (Array.isArray(data.contacts)) return data.contacts;
    if (data.workspace?.contacts) return data.workspace.contacts;
    return [];
  }, [data]);

  const workspaceName = useMemo(() => {
    if (!data) return "Trial Workspace";
    if (data.workspace?.name) return data.workspace.name;
    if (data.name) return data.name;
    return "Trial Workspace";
  }, [data]);

  return {
    data,
    error,
    isLoading,
    companies,
    contacts,
    workspaceName,
    revalidateWorkspace,
  };
}
