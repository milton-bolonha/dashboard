"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSections } from "@/contexts/SectionsContext";

export function Sidebar({ activePlans }) {
  const pathname = usePathname();
  const { sections } = useSections(); // ← Usar contexto global
  const [isHovered, setIsHovered] = useState(false);

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: "dashboard" },
    { name: "Content Types", href: "/dashboard/content-types", icon: "types" },
    { name: "Sections", href: "/dashboard/sections", icon: "folder" },
    { name: "Users", href: "/dashboard/users", icon: "users" },
    { name: "Plans", href: "/dashboard/plans", icon: "plans" },
    { name: "Billing", href: "/dashboard/billing", icon: "billing" },
  ];

  // Adicionar indicador visual para planos ativos
  const enhancedNavigation = navigation.map((item) => {
    if (item.name === "Plans" || item.name === "Billing") {
      return {
        ...item,
        badge: activePlans?.length > 0 ? activePlans.length : null,
      };
    }
    return item;
  });

  const icons = {
    dashboard: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
      </svg>
    ),
    types: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    users: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
      </svg>
    ),
    plans: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
        <path
          fillRule="evenodd"
          d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z"
          clipRule="evenodd"
        />
      </svg>
    ),
    billing: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
        <path
          fillRule="evenodd"
          d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z"
          clipRule="evenodd"
        />
      </svg>
    ),
    dev: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path
          fillRule="evenodd"
          d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z"
          clipRule="evenodd"
        />
      </svg>
    ),
    folder: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
      </svg>
    ),
  };

  return (
    <div
      className={`bg-gray-900 flex flex-col transition-all duration-300 ease-in-out overflow-hidden ${
        isHovered ? "w-64" : "w-16"
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex-1 flex flex-col min-h-0">
        {/* Header */}
        <div className="flex items-center h-16 flex-shrink-0 px-4 bg-gray-900 border-b border-gray-800">
          <div className="flex items-center min-w-0">
            <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-sm">D</span>
            </div>
            <div
              className={`ml-3 overflow-hidden transition-all duration-300 ${
                isHovered ? "opacity-100 w-auto" : "opacity-0 w-0"
              }`}
            >
              <span className="text-white font-semibold whitespace-nowrap">
                Dashboard Engine
              </span>
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto custom-scrollbar">
          {/* Indicador de planos ativos */}
          <div
            className={`mx-2 mb-4 overflow-hidden transition-all duration-300 ${
              isHovered && activePlans && activePlans.length > 0
                ? "max-h-20 opacity-100"
                : "max-h-0 opacity-0"
            }`}
          >
            <div className="p-3 bg-pink-900/30 border border-pink-500/30 rounded-lg">
              <div className="flex items-center">
                <div className="h-2 w-2 bg-pink-500 rounded-full mr-2 flex-shrink-0"></div>
                <span className="text-pink-300 text-xs font-medium whitespace-nowrap">
                  {activePlans?.length || 0} plano(s) ativo(s)
                </span>
              </div>
              <div className="mt-1 text-xs text-pink-200/70">
                {activePlans?.join(", ") || ""}
              </div>
            </div>
          </div>

          <nav className="mt-5 flex-1 px-2 space-y-1">
            {enhancedNavigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`group w-full flex items-center px-2 py-2 text-sm font-medium rounded-md relative transition-all duration-200 ${
                    isActive
                      ? "bg-gray-800 text-white"
                      : "text-gray-300 hover:bg-gray-700 hover:text-white"
                  }`}
                  title={!isHovered ? item.name : undefined}
                >
                  {/* Ícone sempre fixo */}
                  <div className="flex-shrink-0 w-5 h-5">
                    {icons[item.icon]}
                  </div>

                  {/* Texto que desliza */}
                  <div
                    className={`ml-3 overflow-hidden transition-all duration-300 ${
                      isHovered ? "opacity-100 w-auto" : "opacity-0 w-0"
                    }`}
                  >
                    <span className="whitespace-nowrap">{item.name}</span>
                  </div>

                  {/* Badge */}
                  {item.badge && (
                    <div
                      className={`bg-pink-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
                        isHovered
                          ? "ml-auto opacity-100"
                          : "absolute -top-1 -right-1 opacity-100"
                      }`}
                    >
                      {item.badge}
                    </div>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Sections */}
          <div
            className={`mt-8 px-2 overflow-hidden transition-all duration-300 ${
              isHovered && sections.length > 0
                ? "max-h-96 opacity-100"
                : "max-h-0 opacity-0"
            }`}
          >
            <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
              Sections
            </h3>
            <div className="space-y-1">
              {sections.map((section) => (
                <Link
                  key={section._id}
                  href={`/dashboard/sections/${section.slug}`}
                  className="group w-full flex items-center px-2 py-2 text-sm font-medium text-gray-300 rounded-md hover:text-white hover:bg-gray-700 transition-colors"
                >
                  <div className="flex-shrink-0 w-5 h-5">{icons.folder}</div>
                  <div className="ml-3 overflow-hidden">
                    <span className="whitespace-nowrap truncate">
                      {section.name}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
