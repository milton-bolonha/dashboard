"use client";

import type { PropsWithChildren } from "react";
import { SWRConfig } from "swr";
import { ClerkProvider } from "@clerk/nextjs";

import { ToastProvider } from "@/lib/state/toast-context";
import { MembershipProvider } from "@/lib/state/membership-context";

const swrConfig = {
  fetcher: async (resource: RequestInfo, init?: RequestInit) => {
    const response = await fetch(resource, {
      credentials: "include",
      ...init,
    });

    if (!response.ok) {
      const responseError = new Error("Failed to fetch data") as Error & {
        info?: unknown;
        status?: number;
      };
      const clone = response.clone();
      try {
        responseError.info = await clone.json();
      } catch {
        responseError.info = await response.text();
      }
      responseError.status = response.status;
      throw responseError;
    }

    const contentType = response.headers.get("content-type");
    if (contentType?.includes("application/json")) {
      return response.json();
    }
    return response.text();
  },
  revalidateOnFocus: false,
} satisfies Parameters<typeof SWRConfig>[0]["value"];

export function Providers({ children }: PropsWithChildren) {
  const clerkPublishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

  // If Clerk key is not available, render without ClerkProvider
  // This allows the app to build and run without Clerk (guest mode only)
  if (!clerkPublishableKey) {
    console.warn(
      "[Providers] NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY not found. Running without Clerk authentication."
    );
    return (
      <SWRConfig value={swrConfig}>
        <MembershipProvider>
          <ToastProvider>{children}</ToastProvider>
        </MembershipProvider>
      </SWRConfig>
    );
  }

  return (
    <ClerkProvider publishableKey={clerkPublishableKey}>
      <SWRConfig value={swrConfig}>
        <MembershipProvider>
          <ToastProvider>{children}</ToastProvider>
        </MembershipProvider>
      </SWRConfig>
    </ClerkProvider>
  );
}

