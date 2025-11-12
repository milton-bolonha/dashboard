"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { ChevronRight, Menu, Plus, Settings, User, UserPlus } from "lucide-react";

import type { AdeAppearanceTokens } from "@/lib/ade-theme";

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
  appearance: AdeAppearanceTokens;
  workspaceName: string;
  companies: CompanyOption[];
  onSelectCompany: (sessionId: string) => void;
  onAddCompany?: () => void;
  onAddContact?: () => void;
}

const COIN_ICON = "/images/coin.svg";
const COMPANY_ICON = "/images/company.svg";
const CONTACT_ICON = "/images/contact.svg";

export function AdminSidebarAde({
  appearance,
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

  const primaryText = appearance.textColor;
  const mutedText = appearance.mutedTextColor;
  // Hover color baseado no contraste - usa overlayColor ou cria um hover dinâmico
  const hoverBg = appearance.overlayColor || "rgba(0, 0, 0, 0.05)";

  return (
    <div
      ref={rootRef}
      className={`flex h-full flex-col px-4 py-6 transition-all duration-200 ${collapsed ? "items-center" : ""}`}
      style={{ color: primaryText }}
      suppressHydrationWarning
    >
      <header className="mb-8 flex w-full items-center justify-between">
        <div className={collapsed ? "hidden" : "flex items-center"}>
          <span 
            className="text-sm font-semibold uppercase tracking-[0.28em]" 
            style={{ color: mutedText }}
            suppressHydrationWarning
          >
            {workspaceName}
          </span>
        </div>
        <button
          type="button"
          onClick={handleCollapseToggle}
          className="rounded p-1 transition"
          aria-label="Toggle sidebar"
          style={{ color: primaryText }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = hoverBg;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "transparent";
          }}
          suppressHydrationWarning
        >
          <Menu className="h-5 w-5" style={{ color: primaryText }} />
        </button>
      </header>

      {!collapsed ? (
        <nav className="mb-8 space-y-2 text-sm">
          <button
            type="button"
            className="flex w-full cursor-pointer items-center justify-between rounded-lg px-2 py-2 text-left transition"
            style={{ color: primaryText }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = hoverBg;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
            }}
            suppressHydrationWarning
          >
            <span className="flex items-center gap-2">
              <Image src={COIN_ICON} alt="" width={16} height={16} />
              <span style={{ color: primaryText }} suppressHydrationWarning>Earn credits</span>
            </span>
          </button>
          <button
            type="button"
            className="flex w-full cursor-pointer items-center justify-between rounded-lg px-2 py-2 text-left transition"
            style={{ color: primaryText }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = hoverBg;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
            }}
            suppressHydrationWarning
          >
            <span style={{ color: primaryText }} suppressHydrationWarning>Invite friends</span>
          </button>
          <button
            type="button"
            className="flex w-full cursor-pointer items-center justify-between rounded-lg px-2 py-2 text-left transition"
            style={{ color: primaryText }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = hoverBg;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
            }}
            suppressHydrationWarning
          >
            <span style={{ color: primaryText }} suppressHydrationWarning>Suggest features</span>
          </button>
        </nav>
      ) : null}

      <div className="flex-1 w-full">
        <section className="mb-8">
          <div
            className={`flex items-center ${collapsed ? "justify-center" : "justify-between"} gap-2 px-1`}
          >
            {!collapsed ? (
              <span 
                className="flex items-center gap-2 text-sm font-semibold" 
                style={{ color: primaryText }}
                suppressHydrationWarning
              >
                <Image src={COMPANY_ICON} alt="" width={18} height={18} />
                <span style={{ color: primaryText }} suppressHydrationWarning>Companies</span>
              </span>
            ) : (
              <Image src={COMPANY_ICON} alt="Companies" width={20} height={20} />
            )}
            <button
              type="button"
              onClick={onAddCompany}
              className={`flex h-8 w-8 items-center justify-center rounded-lg transition ${
                onAddCompany ? "cursor-pointer" : "cursor-not-allowed opacity-60"
              }`}
              aria-label="Add company"
              style={{ color: primaryText }}
              onMouseEnter={(e) => {
                if (onAddCompany) {
                  e.currentTarget.style.backgroundColor = hoverBg;
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
              }}
              suppressHydrationWarning
            >
              <Plus className="h-4 w-4" style={{ color: primaryText }} />
            </button>
          </div>

          {collapsed ? (
            <div className="mt-4 flex flex-col items-center gap-3">
              {companies.slice(0, 6).map((company) => (
                <button
                  key={company.sessionId}
                  type="button"
                  onClick={() => onSelectCompany(company.sessionId)}
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-xs font-semibold transition"
                  style={{ color: company.isActive ? primaryText : mutedText }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = hoverBg;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "transparent";
                  }}
                  title={company.name}
                  suppressHydrationWarning
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
                    className="flex w-full cursor-pointer flex-col rounded-lg px-2 py-2 text-left transition"
                    style={{ color: company.isActive ? primaryText : mutedText }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = hoverBg;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "transparent";
                    }}
                    aria-current={company.isActive ? "page" : undefined}
                    suppressHydrationWarning
                  >
                    <div className="flex items-center justify-between">
                      <span 
                        className="truncate font-medium" 
                        style={{ color: company.isActive ? primaryText : mutedText }}
                        suppressHydrationWarning
                      >
                        {company.name}
                      </span>
                      <ChevronRight 
                        className="h-4 w-4" 
                        style={{ color: company.isActive ? primaryText : mutedText }}
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
            className={`flex items-center ${collapsed ? "justify-center" : "justify-between"} gap-2 px-1`}
          >
            {!collapsed ? (
              <span 
                className="flex items-center gap-2 text-sm font-semibold" 
                style={{ color: primaryText }}
                suppressHydrationWarning
              >
                <Image src={CONTACT_ICON} alt="" width={18} height={18} />
                <span style={{ color: primaryText }} suppressHydrationWarning>Contacts</span>
              </span>
            ) : (
              <Image src={CONTACT_ICON} alt="Contacts" width={20} height={20} />
            )}
            <button
              type="button"
              onClick={onAddContact}
              className={`flex h-8 w-8 items-center justify-center rounded-lg transition ${
                onAddContact ? "cursor-pointer" : "cursor-not-allowed opacity-60"
              }`}
              aria-label="Add contact"
              style={{ color: primaryText }}
              onMouseEnter={(e) => {
                if (onAddContact) {
                  e.currentTarget.style.backgroundColor = hoverBg;
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
              }}
              suppressHydrationWarning
            >
              <UserPlus className="h-4 w-4" style={{ color: primaryText }} />
            </button>
          </div>
        </section>
      </div>

      {!collapsed ? (
        <footer 
          className="mt-8 w-full space-y-2 text-sm" 
          style={{ color: mutedText }}
          suppressHydrationWarning
        >
          <button
            type="button"
            className="flex w-full cursor-pointer items-center justify-between rounded-lg px-2 py-2 text-left transition"
            style={{ color: primaryText }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = hoverBg;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
            }}
            suppressHydrationWarning
          >
            <span style={{ color: primaryText }} suppressHydrationWarning>Profile</span>
            <User className="h-4 w-4" style={{ color: primaryText }} />
          </button>
          <button
            type="button"
            className="flex w-full cursor-pointer items-center justify-between rounded-lg px-2 py-2 text-left transition"
            style={{ color: primaryText }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = hoverBg;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
            }}
            suppressHydrationWarning
          >
            <span style={{ color: primaryText }} suppressHydrationWarning>Settings</span>
            <Settings className="h-4 w-4" style={{ color: primaryText }} />
          </button>
        </footer>
      ) : null}
    </div>
  );
}

