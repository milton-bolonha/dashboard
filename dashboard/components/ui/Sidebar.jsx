"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function Sidebar() {
  const [sections, setSections] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const pathname = usePathname();

  // 🎨 BIBLIOTECA DE ÍCONES SVG PROFISSIONAIS (mantendo o que funcionou)
  const getIconSvg = (iconKey) => {
    const icons = {
      "document-text": (
        <path
          fillRule="evenodd"
          d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z"
          clipRule="evenodd"
        />
      ),
      newspaper: (
        <path
          fillRule="evenodd"
          d="M2 5a2 2 0 012-2h8a2 2 0 012 2v10a2 2 0 002 2H4a2 2 0 01-2-2V5zm3 1h6v4H5V6zm6 6H5v2h6v-2z"
          clipRule="evenodd"
        />
      ),
      "book-open": (
        <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V4.804z" />
      ),
      photograph: (
        <path
          fillRule="evenodd"
          d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
          clipRule="evenodd"
        />
      ),
      "shopping-bag": (
        <path
          fillRule="evenodd"
          d="M10 2a4 4 0 00-4 4v1H5a1 1 0 00-.994.89l-1 9A1 1 0 004 18h12a1 1 0 00.994-1.11l-1-9A1 1 0 0015 7h-1V6a4 4 0 00-4-4zM8 6V5a2 2 0 114 0v1H8zm-1 3a1 1 0 112 0 1 1 0 01-2 0zm7 0a1 1 0 01-2 0 1 1 0 112 0z"
          clipRule="evenodd"
        />
      ),
      tag: (
        <path
          fillRule="evenodd"
          d="M17.707 9.293a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-7-7A.997.997 0 012 10V5a3 3 0 013-3h5c.256 0 .512.098.707.293l7 7zM5 6a1 1 0 100-2 1 1 0 000 2z"
          clipRule="evenodd"
        />
      ),
      "shopping-cart": (
        <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
      ),
      "credit-card": (
        <path
          fillRule="evenodd"
          d="M4 2a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V4a2 2 0 00-2-2H4zm0 2h12v2H4V4zm0 4h12v4H4V8z"
          clipRule="evenodd"
        />
      ),
      user: (
        <path
          fillRule="evenodd"
          d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
          clipRule="evenodd"
        />
      ),
      "user-group": (
        <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
      ),
      users: (
        <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
      ),
      "clipboard-list": (
        <path
          fillRule="evenodd"
          d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
          clipRule="evenodd"
        />
      ),
      "check-circle": (
        <path
          fillRule="evenodd"
          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
          clipRule="evenodd"
        />
      ),
      "chart-bar": (
        <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
      ),
      chat: (
        <path
          fillRule="evenodd"
          d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z"
          clipRule="evenodd"
        />
      ),
      mail: (
        <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
      ),
      star: (
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      ),
      "lock-closed": (
        <path
          fillRule="evenodd"
          d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
          clipRule="evenodd"
        />
      ),
      cog: (
        <path
          fillRule="evenodd"
          d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z"
          clipRule="evenodd"
        />
      ),
      folder: (
        <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
      ),
      home: (
        <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
      ),
      template: (
        <path
          fillRule="evenodd"
          d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"
          clipRule="evenodd"
        />
      ),
      collection: (
        <path
          fillRule="evenodd"
          d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
          clipRule="evenodd"
        />
      ),
      menu: (
        <path
          fillRule="evenodd"
          d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
          clipRule="evenodd"
        />
      ),
      "chevron-down": (
        <path
          fillRule="evenodd"
          d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
          clipRule="evenodd"
        />
      ),
      "chevron-right": (
        <path
          fillRule="evenodd"
          d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
          clipRule="evenodd"
        />
      ),
    };

    return icons[iconKey] || icons["folder"];
  };

  useEffect(() => {
    fetchSections();
  }, []);

  const fetchSections = async () => {
    try {
      const response = await fetch("/api/sections");
      if (response.ok) {
        const data = await response.json();
        console.log("🔍 Sections carregadas:", data); // Debug
        // Assumir que sections são ativas se o campo não existe
        const activeSections = Array.isArray(data) ? data : data.sections || [];
        console.log("✅ Sections filtradas:", activeSections); // Debug
        setSections(activeSections);
      }
    } catch (error) {
      console.error("❌ Erro ao carregar sections:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const isActive = (href, exact = false) => {
    if (exact) {
      return pathname === href;
    }

    // Para /dashboard/sections, só ativar se for exatamente a página de sections, não as subpáginas
    if (href === "/dashboard/sections") {
      return pathname === "/dashboard/sections";
    }

    return pathname.startsWith(href);
  };

  const actualWidth = isCollapsed && !isHovered ? "w-16" : "w-64";

  return (
    <div
      className={`${actualWidth} bg-gray-900 h-screen flex flex-col transition-all duration-300 fixed left-0 top-0 z-40`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-800">
        <div
          className={`overflow-hidden transition-all duration-300 ${
            isCollapsed && !isHovered ? "opacity-0 w-0" : "opacity-100 w-auto"
          }`}
        >
          <h1 className="text-lg font-bold text-white whitespace-nowrap">
            Dashboard Engine
          </h1>
        </div>
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1.5 rounded-md text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
          title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            {getIconSvg("menu")}
          </svg>
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2 space-y-1">
        {/* Core Navigation */}
        <div className="mb-2">
          <Link
            href="/dashboard"
            className={`group w-full flex items-center px-2 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
              isActive("/dashboard", true)
                ? "bg-gray-800 text-white shadow-lg border-l-4 border-blue-500"
                : "text-gray-300 hover:bg-gray-700 hover:text-white"
            }`}
            title={isCollapsed && !isHovered ? "Dashboard" : ""}
          >
            <div
              className={`flex-shrink-0 w-5 h-5 ${
                isActive("/dashboard", true) ? "text-blue-400" : ""
              }`}
            >
              <svg fill="currentColor" viewBox="0 0 20 20">
                {getIconSvg("home")}
              </svg>
            </div>
            <div
              className={`ml-3 overflow-hidden transition-all duration-300 ${
                isCollapsed && !isHovered
                  ? "opacity-0 w-0"
                  : "opacity-100 w-auto"
              }`}
            >
              <span className="whitespace-nowrap">Dashboard</span>
            </div>
          </Link>
        </div>

        {/* Dynamic Sections */}
        {sections.length > 0 && (
          <div className="mb-2">
            <div className="space-y-1">
              {sections.map((section) => (
                <Link
                  key={section._id}
                  href={`/dashboard/sections/${section.slug}`}
                  className={`group w-full flex items-center px-2 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                    isActive(`/dashboard/sections/${section.slug}`)
                      ? "bg-gray-800 text-white shadow-lg border-l-4 border-blue-500"
                      : "text-gray-300 hover:bg-gray-700 hover:text-white"
                  }`}
                  title={isCollapsed && !isHovered ? section.name : ""}
                >
                  <div
                    className={`flex-shrink-0 w-5 h-5 ${
                      isActive(`/dashboard/sections/${section.slug}`)
                        ? "text-blue-400"
                        : ""
                    }`}
                  >
                    <svg fill="currentColor" viewBox="0 0 20 20">
                      {getIconSvg(section.icon || "folder")}
                    </svg>
                  </div>
                  <div
                    className={`ml-3 overflow-hidden transition-all duration-300 ${
                      isCollapsed && !isHovered
                        ? "opacity-0 w-0"
                        : "opacity-100 w-auto"
                    }`}
                  >
                    <span className="whitespace-nowrap">{section.name}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Content Creator - Corrigido completamente */}
        <div className="mb-2">
          <button
            onClick={() => setShowConfig(!showConfig)}
            className="w-full flex items-center justify-between px-2 py-2 text-sm font-medium text-gray-300 hover:bg-gray-700 hover:text-white rounded-md transition-all duration-200 cursor-pointer"
            title={isCollapsed && !isHovered ? "Content Creator" : ""}
          >
            <div className="flex items-center">
              <div className="flex-shrink-0 w-5 h-5">
                <svg fill="currentColor" viewBox="0 0 20 20">
                  {getIconSvg("template")}
                </svg>
              </div>
              <div
                className={`ml-3 overflow-hidden transition-all duration-300 ${
                  isCollapsed && !isHovered
                    ? "opacity-0 w-0"
                    : "opacity-100 w-auto"
                }`}
              >
                <span className="whitespace-nowrap">Content Creator</span>
              </div>
            </div>
            <div
              className={`flex-shrink-0 w-4 h-4 transition-all duration-200 ${
                isCollapsed && !isHovered ? "opacity-0" : "opacity-100"
              } ${showConfig ? "rotate-180" : "rotate-0"}`}
            >
              <svg fill="currentColor" viewBox="0 0 20 20">
                {getIconSvg("chevron-down")}
              </svg>
            </div>
          </button>

          {/* Submenus - Comportamento correto quando collapsed */}
          {showConfig && (
            <div
              className={`mt-1 space-y-1 transition-all duration-300 ${
                isCollapsed && !isHovered ? "ml-0" : "ml-2"
              }`}
            >
              <Link
                href="/dashboard/sections"
                className={`group w-full flex items-center px-2 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                  isActive("/dashboard/sections")
                    ? "bg-gray-800 text-white shadow-lg border-l-4 border-blue-500"
                    : "text-gray-300 hover:bg-gray-700 hover:text-white"
                }`}
                title={isCollapsed && !isHovered ? "Sections" : ""}
              >
                <div
                  className={`flex-shrink-0 w-5 h-5 ${
                    isActive("/dashboard/sections") ? "text-blue-400" : ""
                  }`}
                >
                  <svg fill="currentColor" viewBox="0 0 20 20">
                    {getIconSvg("collection")}
                  </svg>
                </div>
                <div
                  className={`ml-3 overflow-hidden transition-all duration-300 ${
                    isCollapsed && !isHovered
                      ? "opacity-0 w-0"
                      : "opacity-100 w-auto"
                  }`}
                >
                  <span className="whitespace-nowrap">Sections</span>
                </div>
              </Link>
              <Link
                href="/dashboard/content-types"
                className={`group w-full flex items-center px-2 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                  isActive("/dashboard/content-types")
                    ? "bg-gray-800 text-white shadow-lg border-l-4 border-blue-500"
                    : "text-gray-300 hover:bg-gray-700 hover:text-white"
                }`}
                title={isCollapsed && !isHovered ? "Content Types" : ""}
              >
                <div
                  className={`flex-shrink-0 w-5 h-5 ${
                    isActive("/dashboard/content-types") ? "text-blue-400" : ""
                  }`}
                >
                  <svg fill="currentColor" viewBox="0 0 20 20">
                    {getIconSvg("template")}
                  </svg>
                </div>
                <div
                  className={`ml-3 overflow-hidden transition-all duration-300 ${
                    isCollapsed && !isHovered
                      ? "opacity-0 w-0"
                      : "opacity-100 w-auto"
                  }`}
                >
                  <span className="whitespace-nowrap">Content Types</span>
                </div>
              </Link>
            </div>
          )}
        </div>

        {/* Management - Margens consistentes */}
        <div className="mb-2">
          <div className="space-y-1">
            <Link
              href="/dashboard/users"
              className={`group w-full flex items-center px-2 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                isActive("/dashboard/users")
                  ? "bg-gray-800 text-white shadow-lg border-l-4 border-gray-600"
                  : "text-gray-300 hover:bg-gray-700 hover:text-white"
              }`}
              title={isCollapsed && !isHovered ? "Users" : ""}
            >
              <div
                className={`flex-shrink-0 w-5 h-5 ${
                  isActive("/dashboard/users") ? "text-gray-400" : ""
                }`}
              >
                <svg fill="currentColor" viewBox="0 0 20 20">
                  {getIconSvg("users")}
                </svg>
              </div>
              <div
                className={`ml-3 overflow-hidden transition-all duration-300 ${
                  isCollapsed && !isHovered
                    ? "opacity-0 w-0"
                    : "opacity-100 w-auto"
                }`}
              >
                <span className="whitespace-nowrap">Users</span>
              </div>
            </Link>
            <Link
              href="/dashboard/billing"
              className={`group w-full flex items-center px-2 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                isActive("/dashboard/billing")
                  ? "bg-gray-800 text-white shadow-lg border-l-4 border-gray-600"
                  : "text-gray-300 hover:bg-gray-700 hover:text-white"
              }`}
              title={isCollapsed && !isHovered ? "Billing" : ""}
            >
              <div
                className={`flex-shrink-0 w-5 h-5 ${
                  isActive("/dashboard/billing") ? "text-gray-400" : ""
                }`}
              >
                <svg fill="currentColor" viewBox="0 0 20 20">
                  {getIconSvg("credit-card")}
                </svg>
              </div>
              <div
                className={`ml-3 overflow-hidden transition-all duration-300 ${
                  isCollapsed && !isHovered
                    ? "opacity-0 w-0"
                    : "opacity-100 w-auto"
                }`}
              >
                <span className="whitespace-nowrap">Billing</span>
              </div>
            </Link>
          </div>
        </div>

        {/* Settings - Margem consistente */}
        <div className="mb-2">
          <Link
            href="/dashboard/settings"
            className={`group w-full flex items-center px-2 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
              isActive("/dashboard/settings")
                ? "bg-gray-800 text-white shadow-lg border-l-4 border-gray-600"
                : "text-gray-300 hover:bg-gray-700 hover:text-white"
            }`}
            title={isCollapsed && !isHovered ? "Settings" : ""}
          >
            <div
              className={`flex-shrink-0 w-5 h-5 ${
                isActive("/dashboard/settings") ? "text-gray-400" : ""
              }`}
            >
              <svg fill="currentColor" viewBox="0 0 20 20">
                {getIconSvg("cog")}
              </svg>
            </div>
            <div
              className={`ml-3 overflow-hidden transition-all duration-300 ${
                isCollapsed && !isHovered
                  ? "opacity-0 w-0"
                  : "opacity-100 w-auto"
              }`}
            >
              <span className="whitespace-nowrap">Settings</span>
            </div>
          </Link>
        </div>
      </nav>

      {/* Footer */}
      <div
        className={`p-4 border-t border-gray-800 transition-all duration-300 ${
          isCollapsed && !isHovered ? "opacity-0" : "opacity-100"
        }`}
      >
        <div className="text-xs text-gray-500 text-center">
          v1.0.0 • Dashboard Engine
        </div>
      </div>
    </div>
  );
}
