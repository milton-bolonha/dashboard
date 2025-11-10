"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronRight, Menu, Plus, Settings, User, UserPlus } from "lucide-react";

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

  const handleCollapseToggle = () => setCollapsed((state) => !state);

  return (
    <div
      ref={rootRef}
      className={`flex h-full flex-col bg-[#efefef] px-4 py-6 text-[#5f5f5f] transition-all duration-200 ${
        collapsed ? "items-center" : ""
      }`}
    >
      <header className="mb-8 flex w-full items-center justify-between">
        <div className={collapsed ? "hidden" : "flex items-center"}>
          <span className="text-sm font-semibold uppercase tracking-[0.28em] text-gray-700">
            {workspaceName}
          </span>
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
          <button
            type="button"
            className="flex w-full cursor-pointer items-center justify-between px-2 py-2 text-left text-gray-600 transition hover:text-gray-900"
          >
            <span>Earn credits</span>
            <Plus className="h-4 w-4" />
          </button>
          <button
            type="button"
            className="flex w-full cursor-pointer items-center justify-between px-2 py-2 text-left text-gray-600 transition hover:text-gray-900"
          >
            <span>Invite friends</span>
            <Plus className="h-4 w-4" />
          </button>
          <button
            type="button"
            className="flex w-full cursor-pointer items-center justify-between px-2 py-2 text-left text-gray-600 transition hover:text-gray-900"
          >
            <span>Suggest features</span>
            <Plus className="h-4 w-4" />
          </button>
        </nav>
      ) : null}

      <div className="flex-1 w-full">
        <section className="mb-8">
          <div
            className={`flex items-center ${
              collapsed ? "justify-center" : "justify-between"
            } gap-2 px-1`}
          >
            {!collapsed ? (
              <span className="text-sm font-semibold text-gray-800">Companies</span>
            ) : null}
            <button
              type="button"
              onClick={onAddCompany}
              className={`flex h-8 w-8 items-center justify-center text-gray-500 transition hover:text-gray-900 ${
                onAddCompany ? "cursor-pointer" : "cursor-not-allowed opacity-60"
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
                  className={`flex h-9 w-9 items-center justify-center text-xs font-semibold transition ${
                    company.isActive ? "text-gray-900" : "text-gray-600 hover:text-gray-900"
                  } cursor-pointer`}
                  title={company.name}
                >
                  {company.name.charAt(0).toUpperCase()}
                </button>
              ))}
            </div>
          ) : (
            <ul className="mt-4 space-y-1 text-sm">
              {companies.map((company) => (
                <li key={company.sessionId}>
                  <button
                    type="button"
                    onClick={() => onSelectCompany(company.sessionId)}
                    className={`flex w-full cursor-pointer flex-col px-1 py-2 text-left transition ${
                      company.isActive
                        ? "font-semibold text-gray-900"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                    aria-current={company.isActive ? "page" : undefined}
                  >
                    <div className="flex items-center justify-between">
                      <span className="truncate font-medium">{company.name}</span>
                      <ChevronRight
                        className={`h-4 w-4 transition ${
                          company.isActive ? "text-gray-400" : "text-gray-300"
                        }`}
                      />
                    </div>
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
              className={`flex h-8 w-8 items-center justify-center text-gray-500 transition hover:text-gray-900 ${
                onAddContact ? "cursor-pointer" : "cursor-not-allowed opacity-60"
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
            className="flex w-full cursor-pointer items-center justify-between px-2 py-2 text-left transition hover:text-gray-900"
          >
            <span>Profile</span>
            <User className="h-4 w-4" />
          </button>
          <button
            type="button"
            className="flex w-full cursor-pointer items-center justify-between px-2 py-2 text-left transition hover:text-gray-900"
          >
            <span>Settings</span>
            <Settings className="h-4 w-4" />
          </button>
        </footer>
      ) : null}
    </div>
  );
}

