"use client";

import { useState } from "react";
import React from "react";

export default function AppLayout({ sidebar, header, children }) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  return (
    <div className="flex h-screen">
      {/* Passando o estado e a função para o Sidebar */}
      {sidebar &&
        React.cloneElement(sidebar, {
          isCollapsed: isSidebarCollapsed,
          toggle: toggleSidebar,
        })}

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* TODO: Passar toggle para o Header também se necessário */}
        {header}
        <main
          className="flex-1 overflow-x-hidden overflow-y-auto"
          style={{ background: "#fcfcf9" }}
        >
          <div className="container mx-auto px-6 py-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
