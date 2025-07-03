"use client";

import { WorkspaceProvider } from "./WorkspaceContext";
import { SectionsProvider } from "./SectionsContext";

export function DashboardProviders({ children }) {
  return (
    <WorkspaceProvider>
      <SectionsProvider>{children}</SectionsProvider>
    </WorkspaceProvider>
  );
}
