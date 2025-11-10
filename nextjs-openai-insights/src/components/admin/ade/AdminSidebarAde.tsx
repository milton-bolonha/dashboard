"use client";

import { useEffect, useRef, useState } from "react";
import {
  CalendarClock,
  ChevronRight,
  Menu,
  Plus,
  Sparkles,
  UserPlus,
} from "lucide-react";

interface CompanyOption {
  sessionId: string;
  name: string;
  generatedAt?: string;
  tilesCount: number;
  notesCount: number;
  contactsCount: number;
  isActive: boolean;
}

interface AdminSidebarAdeProps {
  workspaceName: string;
  companies: CompanyOption[];
  onSelectCompany: (sessionId: string) => void;
  onAddCompany?: () => void;
  onAddContact?: () => void;
}

export function AdminSidebarAde({
  workspaceName,
  companies,
  onSelectCompany,
  onAddCompany,
  onAddContact,
}: AdminSidebarAdeProps) {
  const [collapsed, setCollapsed] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const asideElement = rootRef.current?.closest("aside");
    if (!asideElement) return;
    const width = collapsed ? "4.5rem" : "17rem";
    asideElement.style.width = width;
    asideElement.classList.toggle("ade-sidebar-collapsed", collapsed);
  }, [collapsed]);

  const formatGeneratedAt = (value?: string) => {
    if (!value) return "Recently generated";
    try {
      return new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(value));
    } catch {
      return value;
    }
  };

  const handleCollapseToggle = () => setCollapsed((state) => !state);

  return (
    <div
      ref={rootRef}
      className={`flex h-full flex-col bg-[#efefef] px-4 py-6 text-[#5f5f5f] transition-all duration-200 ${
        collapsed ? "items-center" : ""
      }`}
    >
      <header className="mb-8 flex w-full items-center justify-between">
        <div className={collapsed ? "hidden" : "flex items-center gap-2"}>
          <span className="text-sm font-semibold uppercase tracking-[0.28em]">
            {workspaceName}
          </span>
          <Sparkles className="h-4 w-4 text-amber-400" />
        </div>
        <button
          type="button"
          onClick={handleCollapseToggle}
          className="rounded p-1 transition hover:bg-gray-200"
          aria-label="Toggle sidebar"
        >
          <Menu className="h-5 w-5 text-gray-700" />
        </button>
      </header>

      {!collapsed ? (
        <nav className="mb-8 space-y-2 text-sm">
          <p className="px-1 text-xs font-semibold uppercase tracking-[0.24em] text-gray-500">
            Actions
          </p>
          <button
            type="button"
            className="flex w-full items-center justify-between rounded-md px-2 py-2 text-left transition hover:bg-gray-200"
          >
            <span>Earn credits</span>
            <Plus className="h-4 w-4" />
          </button>
          <button
            type="button"
            className="flex w-full items-center justify-between rounded-md px-2 py-2 text-left transition hover:bg-gray-200"
          >
            <span>Invite friends</span>
            <Plus className="h-4 w-4" />
          </button>
          <button
            type="button"
            className="flex w-full items-center justify-between rounded-md px-2 py-2 text-left transition hover:bg-gray-200"
          >
            <span>Suggest features</span>
            <Plus className="h-4 w-4" />
          </button>
        </nav>
      ) : null}

      <div className="flex-1 w-full overflow-y-auto">
        <section className="mb-8">
          <div
            className={`flex items-center ${
              collapsed ? "justify-center" : "justify-between"
            } gap-2 px-1`}
          >
            {!collapsed ? (
              <span className="text-sm font-semibold text-gray-800">
                Companies / Entities
              </span>
            ) : null}
            <button
              type="button"
              onClick={onAddCompany}
              className={`flex h-8 w-8 items-center justify-center rounded-full border border-gray-400 text-gray-600 transition hover:bg-gray-200 ${
                onAddCompany ? "" : "cursor-not-allowed opacity-60"
              }`}
              aria-label="Add company"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>

          {collapsed ? (
            <div className="mt-4 flex flex-col items-center gap-3">
              {companies.slice(0, 6).map((company) => (
                <button
                  key={company.sessionId}
                  type="button"
                  onClick={() => onSelectCompany(company.sessionId)}
                  className={`flex h-9 w-9 items-center justify-center rounded-full border text-xs font-semibold transition ${
                    company.isActive
                      ? "border-black bg-black text-white"
                      : "border-transparent bg-white text-gray-700 hover:border-gray-300"
                  }`}
                  title={company.name}
                >
                  {company.name.charAt(0).toUpperCase()}
                </button>
              ))}
            </div>
          ) : (
            <ul className="mt-4 space-y-2 text-sm text-gray-700">
              {companies.map((company) => (
                <li key={company.sessionId}>
                  <button
                    type="button"
                    onClick={() => onSelectCompany(company.sessionId)}
                    className={`flex w-full flex-col rounded-md px-2 py-2 text-left transition hover:bg-gray-200 ${
                      company.isActive ? "bg-black text-white hover:bg-black" : ""
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="truncate font-medium">{company.name}</span>
                      <ChevronRight className="h-4 w-4 opacity-60" />
                    </div>
                    <span
                      className={`mt-1 flex items-center gap-1 text-[0.65rem] uppercase tracking-[0.28em] ${
                        company.isActive ? "text-white/70" : "text-gray-500"
                      }`}
                    >
                      <CalendarClock className="h-3 w-3" />
                      {formatGeneratedAt(company.generatedAt)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <div
            className={`flex items-center ${
              collapsed ? "justify-center" : "justify-between"
            } gap-2 px-1`}
          >
            {!collapsed ? (
              <span className="text-sm font-semibold text-gray-800">Contacts</span>
            ) : null}
            <button
              type="button"
              onClick={onAddContact}
              className={`flex h-8 w-8 items-center justify-center rounded-full border border-gray-400 text-gray-600 transition hover:bg-gray-200 ${
                onAddContact ? "" : "cursor-not-allowed opacity-60"
              }`}
              aria-label="Add contact"
            >
              <UserPlus className="h-4 w-4" />
            </button>
          </div>
        </section>
      </div>

      {!collapsed ? (
        <footer className="mt-8 w-full space-y-2 text-sm text-gray-600">
          <button
            type="button"
            className="flex w-full items-center justify-between rounded-md px-2 py-2 text-left transition hover:bg-gray-200"
          >
            <span>Profile</span>
            <span>👤</span>
          </button>
          <button
            type="button"
            className="flex w-full items-center justify-between rounded-md px-2 py-2 text-left transition hover:bg-gray-200"
          >
            <span>Settings</span>
            <span>⚙️</span>
          </button>
        </footer>
      ) : null}
    </div>
  );
}

