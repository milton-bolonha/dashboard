"use client";

import { useState } from "react";
import React from "react";

export function AppLayout({ sidebar, header, children, background }) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  return (
    <div
      className="flex h-screen"
      style={{
        backgroundColor:
          background?.type === "solid" ? background.value : undefined,
        backgroundImage:
          background?.type === "image" ? `url(${background.value})` : undefined,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* Passando o estado e a função para o Sidebar */}
      {sidebar &&
        React.cloneElement(sidebar, {
          isCollapsed: isSidebarCollapsed,
          toggle: toggleSidebar,
        })}

      <div
        className="flex-1 flex flex-col overflow-hidden"
        style={{
          backgroundColor:
            background?.type === "solid" ? background.value : undefined,
          backgroundImage:
            background?.type === "image"
              ? `url(${background.value})`
              : undefined,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        {/* TODO: Passar toggle para o Header também se necessário */}
        {header}
        <main
          className="flex-1 overflow-x-hidden overflow-y-auto"
          style={{
            background:
              background?.type === "solid" ? "transparent" : "#fcfcf9",
            backgroundColor:
              background?.type === "solid" ? "transparent" : undefined,
          }}
        >
          <div className="container mx-auto px-6 py-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
