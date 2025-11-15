"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronRight, Menu, Plus, Settings, User, UserPlus } from "lucide-react";

import type { AdeAppearanceTokens } from "@/lib/ade-theme";
import { getContrastingTextColor, mixColors, hexToRgbString } from "@/lib/color";

interface CompanyOption {
  sessionId: string;
  name: string;
  generatedAt?: string;
  tilesCount: number;
  notesCount: number;
  contactsCount: number;
  dashboardsCount?: number;
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
  // Initialize collapsed state consistently (always false on mount)
  const [collapsed, setCollapsed] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  
  // SIMPLIFIED: Always use appearance.textColor directly (it's already calculated correctly)
  // No reactive system, no recalculation - just trust the appearance prop
  // IMPORTANT: useMemo must be called before any early returns (Rules of Hooks)
  const colors = useMemo(() => {
    if (!appearance?.textColor || !appearance?.sidebarColor) {
      return {
        primaryText: "rgb(0, 0, 0)",
        mutedText: "rgb(102, 102, 102)",
        hoverBg: "rgba(0, 0, 0, 0.05)",
        badgeBg: "rgb(229, 229, 229)",
        badgeText: "rgb(0, 0, 0)",
      };
    }

    const textColor = appearance.textColor.trim();
    const sidebarBg = appearance.sidebarColor.trim();
    const mutedColor = appearance.mutedTextColor?.trim() || mixColors(textColor, sidebarBg, 0.55);
    const badgeBackground = mixColors(sidebarBg, textColor, textColor === "#000000" ? 0.15 : 0.2);
    const badgeTextColor = getContrastingTextColor(badgeBackground);

    return {
      primaryText: hexToRgbString(textColor),
      mutedText: hexToRgbString(mutedColor),
      hoverBg: appearance.overlayColor || "rgba(0, 0, 0, 0.05)",
      badgeBg: hexToRgbString(badgeBackground),
      badgeText: hexToRgbString(badgeTextColor),
    };
  }, [appearance?.sidebarColor, appearance?.textColor, appearance?.mutedTextColor, appearance?.overlayColor]);

  const { primaryText, mutedText, hoverBg, badgeBg, badgeText } = colors;
  
  // Only render after mount to prevent hydration mismatch
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Handle collapsed state changes
  useEffect(() => {
    if (!isMounted) return;
    const asideElement = rootRef.current?.closest("aside");
    if (!asideElement) return;
    const width = collapsed ? "4.5rem" : "17rem";
    asideElement.style.width = width;
    asideElement.classList.toggle("ade-sidebar-collapsed", collapsed);
  }, [collapsed, isMounted]);

  // Don't render until mounted and appearance is ready
  if (!isMounted || !appearance) {
    return null;
  }

  const handleCollapseToggle = () => setCollapsed((state) => !state);


  // Helper to create hover handlers (reused across buttons)
  const createHoverHandlers = () => ({
    onMouseEnter: (e: React.MouseEvent<HTMLElement>) => {
      e.currentTarget.style.backgroundColor = hoverBg;
    },
    onMouseLeave: (e: React.MouseEvent<HTMLElement>) => {
      e.currentTarget.style.backgroundColor = "transparent";
    },
  });

  return (
    <div
      ref={rootRef}
      className={`flex h-full flex-col px-4 py-6 transition-all duration-200 ${collapsed ? "items-center" : ""}`}
      style={{ color: primaryText }}
    >
      <header className="mb-8 flex w-full items-center justify-between">
        <div className={collapsed ? "hidden" : "flex items-center"}>
          <span 
            className="text-sm font-semibold uppercase tracking-[0.28em]" 
            style={{ color: mutedText }}
          >
            {workspaceName}
          </span>
        </div>
        <button
          type="button"
          onClick={handleCollapseToggle}
          className="rounded p-1 transition"
          aria-label="Toggle sidebar"
          {...createHoverHandlers()}
        >
          <Menu className="h-5 w-5" />
        </button>
      </header>

      {!collapsed ? (
        <nav className="mb-8 space-y-2 text-sm">
          <button
            type="button"
            className="flex w-full cursor-pointer items-center justify-between rounded-lg px-2 py-2 text-left transition"
            style={{ backgroundColor: "transparent" }}
            {...createHoverHandlers()}
          >
            <span className="flex items-center gap-2">
              <Image src={COIN_ICON} alt="" width={16} height={16} />
              <span>Earn credits</span>
            </span>
          </button>
          <button
            type="button"
            className="flex w-full cursor-pointer items-center justify-between rounded-lg px-2 py-2 text-left transition"
            style={{ backgroundColor: "transparent" }}
            {...createHoverHandlers()}
          >
            <span>Invite friends</span>
          </button>
          <button
            type="button"
            className="flex w-full cursor-pointer items-center justify-between rounded-lg px-2 py-2 text-left transition"
            style={{ backgroundColor: "transparent" }}
            {...createHoverHandlers()}
          >
            <span>Suggest features</span>
          </button>
        </nav>
      ) : null}

      <div className="flex-1 w-full" style={{ color: primaryText }}>
        <section className="mb-8" style={{ color: primaryText }}>
          <div
            className={`flex items-center ${collapsed ? "justify-center" : "justify-between"} gap-2 px-1`}
          >
            {!collapsed ? (
              <span className="flex items-center gap-2 text-sm font-semibold" style={{ color: primaryText }}>
                <Image src={COMPANY_ICON} alt="" width={18} height={18} />
                <span>Companies</span>
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
              {...(onAddCompany ? createHoverHandlers() : {})}
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
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-xs font-semibold transition"
                  style={{ color: company.isActive ? primaryText : mutedText }}
                  {...createHoverHandlers()}
                  title={company.name}
                >
                  {company.name.charAt(0).toUpperCase()}
                </button>
              ))}
            </div>
          ) : (
            <ul className="mt-4 space-y-1 text-sm">
              {companies.map((company) => {
                const companyColor = company.isActive ? primaryText : mutedText;
                return (
                  <li key={company.sessionId}>
                    <button
                      type="button"
                      onClick={() => onSelectCompany(company.sessionId)}
                      className="flex w-full cursor-pointer flex-col rounded-lg px-2 py-2 text-left transition"
                      style={{ color: companyColor, backgroundColor: "transparent" }}
                      {...createHoverHandlers()}
                      aria-current={company.isActive ? "page" : undefined}
                    >
                      <div className="flex items-center justify-between" style={{ color: companyColor }}>
                        <span className="truncate font-medium">
                          {company.name}
                        </span>
                        {company.dashboardsCount !== undefined && company.dashboardsCount > 0 ? (
                          <span 
                            className="text-xs font-semibold px-1.5 py-0.5 rounded-full"
                            style={{ backgroundColor: badgeBg, color: badgeText }}
                          >
                            {company.dashboardsCount}
                          </span>
                        ) : (
                          <ChevronRight className="h-4 w-4" style={{ color: companyColor }} />
                        )}
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section style={{ color: primaryText }}>
          <div
            className={`flex items-center ${collapsed ? "justify-center" : "justify-between"} gap-2 px-1`}
          >
            {!collapsed ? (
              <span className="flex items-center gap-2 text-sm font-semibold" style={{ color: primaryText }}>
                <Image src={CONTACT_ICON} alt="" width={18} height={18} />
                <span>Contacts</span>
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
              {...(onAddContact ? createHoverHandlers() : {})}
            >
              <UserPlus className="h-4 w-4" />
            </button>
          </div>
        </section>
      </div>

      {!collapsed ? (
        <footer className="mt-8 w-full space-y-2 text-sm" style={{ color: mutedText }}>
          <button
            type="button"
            className="flex w-full cursor-pointer items-center justify-between rounded-lg px-2 py-2 text-left transition"
            {...createHoverHandlers()}
          >
            <span>Profile</span>
            <User className="h-4 w-4" />
          </button>
          <button
            type="button"
            className="flex w-full cursor-pointer items-center justify-between rounded-lg px-2 py-2 text-left transition"
            {...createHoverHandlers()}
          >
            <span>Settings</span>
            <Settings className="h-4 w-4" />
          </button>
        </footer>
      ) : null}
    </div>
  );
}

