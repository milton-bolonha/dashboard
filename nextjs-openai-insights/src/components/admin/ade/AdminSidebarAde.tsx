"use client";

import { useState } from "react";
import { Coins, Contact, Menu, Plus, Sparkles, Users2 } from "lucide-react";

interface AdminSidebarAdeProps {
  workspaceName: string;
  companyName: string;
  tilesCount: number;
  notesCount: number;
  contactsCount: number;
}

export function AdminSidebarAde({
  workspaceName,
  companyName,
  tilesCount,
  notesCount,
  contactsCount,
}: AdminSidebarAdeProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div
      className={`flex flex-1 flex-col text-[#6b6b6b] transition-all duration-200 ${
        collapsed ? "w-20" : ""
      }`}
    >
      <div
        className={`mb-8 flex items-center ${
          collapsed ? "justify-center" : "justify-between"
        }`}
      >
        <div className={collapsed ? "hidden" : "flex items-center space-x-2"}>
          <span className="text-lg font-semibold text-gray-800">
            {workspaceName}
          </span>
          <Sparkles className="h-4 w-4 text-amber-400" />
        </div>
        <button
          type="button"
          onClick={() => setCollapsed((value) => !value)}
          className="rounded p-1 transition hover:bg-gray-200"
        >
          <Menu className="h-5 w-5 text-gray-700" />
        </button>
      </div>

      <nav className="flex-1 space-y-4">
        {!collapsed ? (
          <div className="space-y-1">
            <SidebarLink icon={<Coins className="h-4 w-4" />} label="Earn Credits" />
            <SidebarLink label="Invite Friends" />
            <SidebarLink label="Suggest Features" />
          </div>
        ) : null}

        <div className="space-y-2">
          {!collapsed ? (
            <>
              <SectionHeader label="Insights" count={tilesCount} />
              <SectionHeader label="Notas" count={notesCount} />
              <SectionHeader label="Contatos" count={contactsCount} />
            </>
          ) : null}
          {!collapsed ? (
            <div className="space-y-2 rounded-lg bg-white p-3 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Users2 className="h-4 w-4 text-gray-600" />
                  <span className="text-sm text-gray-700">Companies</span>
                </div>
                <button className="rounded p-1 transition hover:bg-gray-200">
                  <Plus className="h-4 w-4 text-gray-600" />
                </button>
              </div>
              <div className="rounded-md bg-gray-100 px-3 py-2 text-sm font-medium text-gray-800">
                {companyName}
              </div>
            </div>
          ) : null}

          {!collapsed ? (
            <div className="space-y-2 rounded-lg bg-white p-3 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Contact className="h-4 w-4 text-gray-600" />
                  <span className="text-sm text-gray-700">Contacts</span>
                </div>
                <button className="rounded p-1 transition hover:bg-gray-200">
                  <Plus className="h-4 w-4 text-gray-600" />
                </button>
              </div>
              <p className="text-xs text-gray-500">
                Cadastre decisores-chave para agilizar follow-ups.
              </p>
            </div>
          ) : null}
        </div>
      </nav>

      <div className={collapsed ? "hidden" : "space-y-2 text-center text-xs text-gray-500"}>
        <p>Faça login para gerenciar perfil e ajustes.</p>
        <div className="flex justify-center space-x-2">
          <button className="rounded-lg border border-gray-300 px-3 py-1 text-xs font-medium transition hover:bg-gray-50">
            Log in
          </button>
          <button className="rounded-lg px-3 py-1 text-xs font-medium text-gray-600 transition hover:text-gray-900">
            Sign up
          </button>
        </div>
      </div>
    </div>
  );
}

interface SidebarLinkProps {
  icon?: React.ReactNode;
  label: string;
}

function SidebarLink({ icon, label }: SidebarLinkProps) {
  return (
    <a
      className="flex items-center space-x-3 rounded-md px-2 py-2 text-sm text-[#6B6B6B] transition hover:bg-gray-100 hover:text-black"
      href="#"
    >
      {icon}
      <span>{label}</span>
    </a>
  );
}

interface SectionHeaderProps {
  label: string;
  count: number;
}

function SectionHeader({ label, count }: SectionHeaderProps) {
  return (
    <div className="flex items-center justify-between rounded-md px-2 py-2 text-sm text-gray-700">
      <span>{label}</span>
      <span className="rounded-full bg-gray-200 px-2 py-0.5 text-xs font-medium text-gray-600">
        {count}
      </span>
    </div>
  );
}

