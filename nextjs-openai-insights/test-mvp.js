import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  // Ícones do Simulador/Motor
  RefreshCw,
  Settings,
  Database,
  Zap,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Archive,
  ArrowRight,
  Loader,
  Logs,

  // Ícones da Arquitetura
  ChevronRight,
  ChevronDown,
  FileCode,
  Code,

  // Ícones Novos para Observabilidade
  HeartPulse, // Health
  Users, // Usuários
  Activity, // Traces
  Bug, // Errors
  Gauge, // Performance
  Server, // Ambiente
  Clock, // Período
  X, // Fechar Modal
  User, // Ícone de Usuário
  Network, // Service Map
  DatabaseZap, // DB
  Component as IconComponent, // UI

  // Ícones Novos
  Shield,
  Home,
  Layout,
  Layers,
  ArrowDown,
  Filter, // Para filtros
  Calendar, // Para Período
  Power, // Para Auto-Refresh
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// --- DADOS DA ARQUITETURA (COMPLETO) ---
const SYSTEM_ARCHITECTURE = {
  home: {
    name: "Home",
    path: "/",
    component: "HomeContainer",
    file: "src/containers/home/HomeContainer.tsx",
    children: [
      {
        id: "header",
        name: "LandingHeader",
        type: "component",
        file: "src/components/landing/LandingHeader.tsx",
        children: [
          {
            id: "logo",
            name: "logo",
            type: "element",
            component: "Image",
            props: {},
          },
          {
            id: "btn-login",
            name: "btn-login",
            type: "element",
            component: "SignInButton",
            props: {},
          },
          {
            id: "btn-signup",
            name: "btn-signup",
            type: "element",
            component: "SignUpButton",
            props: {},
          },
        ],
      },
      {
        id: "form",
        name: "ClassicHeroForm",
        type: "component",
        file: "src/components/landing/ClassicHeroForm.tsx",
        children: [
          {
            id: "input-company-name",
            name: "input-company-name",
            type: "input",
            props: { placeholder: "Company name" },
          },
          {
            id: "input-website",
            name: "input-website",
            type: "input",
            props: { placeholder: "Website URL" },
          },
          {
            id: "select-template",
            name: "select-template",
            type: "select",
            props: { options: ["template_1", "template_2"] },
          },
          {
            id: "btn-generate",
            name: "btn-generate",
            type: "button",
            props: { onClick: "handleSubmit" },
          },
        ],
      },
      {
        id: "footer",
        name: "LandingFooter",
        type: "component",
        file: "src/components/landing/LandingFooter.tsx",
        children: [],
      },
    ],
  },
  admin: {
    name: "Admin",
    path: "/admin",
    component: "AdminContainer",
    file: "src/containers/admin/AdminContainer.tsx",
    children: [
      {
        id: "shell",
        name: "AdminShellAde",
        type: "layout",
        file: "src/components/admin/ade/AdminShellAde.tsx",
        children: [
          {
            id: "sidebar",
            name: "AdminSidebarAde",
            type: "component",
            file: "src/components/admin/ade/AdminSidebarAde.tsx",
            children: [
              { id: "menu-header", name: "menu-header", type: "section" },
              {
                id: "credit-links",
                name: "credit-links",
                type: "section",
                children: [
                  {
                    id: "coins-display",
                    name: "coins-display",
                    type: "element",
                  },
                ],
              },
              {
                id: "companies-list",
                name: "companies-list",
                type: "section",
                children: [
                  {
                    id: "company-item",
                    name: "company-item",
                    type: "component",
                    props: { badge: "dashboard-count" },
                  },
                ],
              },
              {
                id: "contacts-section",
                name: "contacts-section",
                type: "section",
                children: [
                  {
                    id: "btn-add-contact",
                    name: "btn-add-contact",
                    type: "button",
                  },
                ],
              },
              { id: "bottom-links", name: "bottom-links", type: "section" },
            ],
          },
          {
            id: "header",
            name: "AdminHeaderAde",
            type: "component",
            file: "src/components/admin/ade/AdminHeaderAde.tsx",
            children: [
              { id: "workspace-name", name: "workspace-name", type: "text" },
              {
                id: "dashboard-selector",
                name: "dashboard-selector",
                type: "dropdown",
              },
              {
                id: "btn-create-blank-dashboard",
                name: "btn-create-blank-dashboard",
                type: "button",
              },
              { id: "btn-templates", name: "btn-templates", type: "button" },
              {
                id: "btn-customize-background",
                name: "btn-customize-background",
                type: "button",
              },
              {
                id: "btn-save-template",
                name: "btn-save-template",
                type: "button",
              },
              { id: "btn-login", name: "btn-login", type: "button" },
              { id: "btn-signup", name: "btn-signup", type: "button" },
            ],
          },
          {
            id: "main",
            name: "main",
            type: "section",
            children: [
              {
                id: "tiles-grid",
                name: "TileGridAde",
                type: "component",
                file: "src/containers/admin/ade/TileGridAde.tsx",
                children: [
                  {
                    id: "btn-add-prompt",
                    name: "btn-add-prompt",
                    type: "button",
                  },
                  {
                    id: "tile-card",
                    name: "tile-card",
                    type: "component",
                    props: { repeat: true },
                    children: [
                      { id: "tile-title", name: "title", type: "text" },
                      { id: "tile-content", name: "content", type: "text" },
                      { id: "btn-drag", name: "btn-drag", type: "button" },
                      {
                        id: "btn-regenerate",
                        name: "btn-regenerate",
                        type: "button",
                      },
                      { id: "btn-delete", name: "btn-delete", type: "button" },
                    ],
                  },
                ],
              },
              {
                id: "contacts-panel",
                name: "ContactsPanelAde",
                type: "component",
                file: "src/containers/admin/ade/ContactsPanelAde.tsx",
                children: [
                  {
                    id: "btn-add-contact",
                    name: "btn-add-contact",
                    type: "button",
                  },
                  {
                    id: "contact-card",
                    name: "contact-card",
                    type: "component",
                    props: { repeat: true },
                    children: [
                      { id: "contact-name", name: "name", type: "text" },
                      { id: "contact-role", name: "role", type: "text" },
                      {
                        id: "btn-regenerate-outreach",
                        name: "btn-regenerate-outreach",
                        type: "button",
                      },
                      { id: "btn-delete", name: "btn-delete", type: "button" },
                    ],
                  },
                ],
              },
              {
                id: "notes-panel",
                name: "NotesPanelAde",
                type: "component",
                file: "src/containers/admin/ade/NotesPanelAde.tsx",
                children: [
                  { id: "btn-add-note", name: "btn-add-note", type: "button" },
                  {
                    id: "form-note",
                    name: "form-note",
                    type: "form",
                    props: { inline: true },
                  },
                  {
                    id: "note-card",
                    name: "note-card",
                    type: "component",
                    props: { repeat: true },
                    children: [
                      {
                        id: "note-header",
                        name: "header",
                        type: "section",
                        props: { color: "orange" },
                      },
                      { id: "note-title", name: "title", type: "text" },
                      {
                        id: "note-content",
                        name: "content",
                        type: "text",
                        props: { bg: "white" },
                      },
                      { id: "btn-edit", name: "btn-edit", type: "button" },
                      { id: "btn-delete", name: "btn-delete", type: "button" },
                    ],
                  },
                ],
              },
              {
                id: "files-placeholder",
                name: "FilesPlaceholderAde",
                type: "component",
                file: "src/containers/admin/ade/FilesPlaceholderAde.tsx",
                children: [],
              },
            ],
          },
        ],
      },
      {
        id: "modals",
        name: "modals",
        type: "section",
        children: [
          { id: "AddPromptModal", name: "AddPromptModal", type: "modal" },
          { id: "AddContactModal", name: "AddContactModal", type: "modal" },
          { id: "AddCompanyModal", name: "AddCompanyModal", type: "modal" },
          {
            id: "ContactDetailModal",
            name: "ContactDetailModal",
            type: "modal",
          },
          { id: "TileDetailModal", name: "TileDetailModal", type: "modal" },
          {
            id: "CreateBlankDashboardModal",
            name: "CreateBlankDashboardModal",
            type: "modal",
          },
          {
            id: "DashboardConfigModal",
            name: "DashboardConfigModal",
            type: "modal",
          },
          {
            id: "TemplateEditorModal",
            name: "TemplateEditorModal",
            type: "modal",
          },
        ],
      },
    ],
  },
};

// --- DADOS DOS FLUXOS ---
const FLOWS_DATA = [
  {
    id: "create-workspace",
    title: "Criar Workspace",
    icon: "📤",
    steps: [
      { label: "Usuário preenche form", details: "ClassicHeroForm" },
      { label: "Valida membership/limits", details: "useMembership hook" },
      {
        label: "POST /api/generate",
        details: "Body: { salesRepCompany, targetCompany, templateId, ... }",
      },
      {
        label: "API processa template",
        details: "Gera 8 tiles com prompts do template",
      },
      { label: "Gera tiles com AI", details: "GPT-5-nano ou GPT-5 (Max Mode)" },
      { label: "Cria WorkspaceSnapshot", details: "Salva em cookie" },
      { label: "Redireciona para /admin", details: 'router.push("/admin")' },
    ],
    result: "Tiles aparecem no grid após geração",
  },
  {
    id: "create-prompt",
    title: "Criar Prompt Individual",
    icon: "➕",
    steps: [
      { label: 'Clica "Add Prompt"', details: "Abre AddPromptModal" },
      { label: "Preenche: title, prompt, Max Mode", details: "Form no modal" },
      {
        label: "POST /api/workspace/tiles",
        details: "Body: { title, prompt, useMaxPrompt?, requestSize? }",
      },
      { label: "API adiciona company context", details: "Invisível ao user" },
      {
        label: "API cria tile com orderIndex negativo",
        details: "orderIndex: -1, -2...",
      },
      {
        label: "Dashboard atualizado diretamente",
        details: "updateDashboard()",
      },
      { label: "Workspace sincronizado", details: "mutate()" },
    ],
    result: "Tile aparece primeiro no grid",
  },
];

// --- MOCK DATA GENERATOR ---
const MOCK_USERS = [
  { id: "u-1", email: "user1@example.com", country: "US" },
  { id: "u-2", email: "user2@example.com", country: "BR" },
  { id: "u-3", email: "user3@example.com", country: "DE" },
  { id: "u-4", email: "user4@example.com", country: "IN" },
];
const MOCK_ACTIONS = [
  { id: "POST /api/generate", icon: "📤", service: "api-gateway" },
  { id: "GET /api/workspace/tiles", icon: "🎴", service: "api-gateway" },
  { id: "POST /api/chat", icon: "💬", service: "chat-service" },
  { id: "GET /home", icon: "🏠", service: "frontend" },
  { id: "GET /api/users/me", icon: "👤", service: "auth-service" },
];
let reqIdCounter = 1;

const createMockRequest = () => {
  const user = MOCK_USERS[Math.floor(Math.random() * MOCK_USERS.length)];
  const action = MOCK_ACTIONS[Math.floor(Math.random() * MOCK_ACTIONS.length)];

  const hasError = Math.random() < 0.1; // 10% de taxa de erro
  let errorType = null;
  if (hasError) {
    const errorRnd = Math.random();
    if (errorRnd < 0.4) errorType = "500 Server Error";
    else if (errorRnd < 0.7) errorType = "401 Unauthorized";
    else errorType = "429 Rate Limit";
  }

  const duration =
    Math.floor(Math.random() * (action.id.startsWith("POST") ? 1200 : 300)) +
    50;
  const cacheRnd = Math.random();
  const cacheStatus = cacheRnd < 0.3 ? "hit" : cacheRnd < 0.5 ? "miss" : "skip";

  return {
    id: reqIdCounter++,
    label: action.id,
    icon: action.icon,
    status: "pending",
    stage: 0,
    user: user,
    duration: duration,
    hasError: hasError,
    errorType: errorType,
    service: action.service,
    cacheStatus: cacheStatus,
    traceId: `trace-${Date.now()}-${reqIdCounter}`,
    timestamp: new Date(),
    spans: [
      {
        id: "span-1",
        service: "frontend-ui",
        duration: Math.floor(duration * 0.1),
        status: "ok",
      },
      {
        id: "span-2",
        service: action.service,
        duration: Math.floor(duration * 0.7),
        status: hasError ? "error" : "ok",
      },
      {
        id: "span-3",
        service: "user-db",
        duration: Math.floor(duration * 0.2),
        status: "ok",
      },
    ],
  };
};

// --- Componentes de UI Primitivos ---
const SegmentedControl = ({
  label,
  options,
  selected,
  setSelected,
  disabled = false,
}) => (
  <div className="flex flex-col">
    <label className="text-xs font-medium text-gray-400 mb-2 flex items-center">
      {label.icon}
      <span className="ml-2">{label.text}</span>
    </label>
    <div className="flex items-center bg-gray-800/70 rounded-lg p-1 border border-gray-700">
      {options.map((option) => (
        <button
          key={option.value}
          onClick={() => !disabled && setSelected(option.value)}
          disabled={disabled}
          className={`flex-1 px-3 py-1 text-xs font-semibold rounded-md transition-colors
              ${
                selected === option.value
                  ? "bg-gray-600/50 text-white"
                  : "text-gray-400 hover:text-white"
              }
              ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          {option.label}
        </button>
      ))}
    </div>
  </div>
);

// --- Componentes do Pipeline (Centro) ---
const StageColumn = ({ title, icon, children, count }) => (
  <div className="flex-1 flex flex-col min-w-[200px] p-4 border-r border-gray-800">
    <div className="flex items-center justify-between text-gray-400 mb-4 pb-2 border-b border-gray-800">
      <div className="flex items-center min-w-0">
        {icon}
        <h3 className="text-sm font-semibold uppercase ml-2 truncate">
          {title}
        </h3>
      </div>
      <span className="text-xs font-mono bg-gray-700/50 text-gray-300 rounded-full px-2 py-0.5">
        {count}
      </span>
    </div>
    <div className="flex-grow h-full space-y-2 overflow-y-auto pr-1">
      {children}
    </div>
  </div>
);

const RequestDot = React.memo(({ request, onClick }) => {
  const [color, icon] = {
    pending: ["bg-gray-500", request.icon],
    running: [
      "bg-blue-500",
      <Loader className="w-3 h-3 text-white animate-spin" />,
    ],
    done: ["bg-green-500", <CheckCircle className="w-3 h-3 text-white" />],
    failed: ["bg-red-500", <XCircle className="w-3 h-3 text-white" />],
  }[request.status];

  return (
    <motion.div
      layout
      onClick={onClick}
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.5 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className={`w-full p-2 rounded-lg flex items-center shadow-md ${color} border ${color.replace(
        "bg",
        "border"
      )}-400 cursor-pointer hover:shadow-lg hover:scale-105 transition-all`}
    >
      {icon && (
        <div className="flex-shrink-0 w-4 h-4 mr-2 flex items-center justify-center text-white text-base">
          {typeof icon === "string" ? icon : icon}
        </div>
      )}
      <span className="text-xs font-medium text-white truncate">
        {request.label}
      </span>
      <span className="text-xs text-white/70 ml-auto flex-shrink-0">
        {request.id}
      </span>
    </motion.div>
  );
});

// --- Painel de Detalhes da Requisição (Modal) ---
const RequestDetailModal = ({ request, onClose }) => {
  if (!request) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.8, y: 50 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.8, y: 50 }}
        className="bg-gray-800 border border-gray-700 w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between p-4 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <span
              className={`text-2xl ${
                request.hasError ? "text-red-500" : "text-green-500"
              }`}
            >
              {request.hasError ? <XCircle /> : <CheckCircle />}
            </span>
            <div>
              <h3 className="text-lg font-bold text-white">{request.label}</h3>
              <span className="text-sm text-gray-400 font-mono">
                ID: {request.traceId}
              </span>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </header>

        <div className="p-6 grid grid-cols-2 gap-6">
          {/* Coluna 1: Detalhes */}
          <div>
            <h4 className="text-sm font-semibold text-gray-400 uppercase mb-3">
              Detalhes
            </h4>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-gray-500" />
                <span className="text-white">{request.user.email}</span>
                <span className="text-xs bg-gray-600 text-gray-200 px-2 py-0.5 rounded-full">
                  {request.user.country}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-gray-500" />
                <span className="text-white">
                  {request.timestamp.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Gauge className="w-5 h-5 text-gray-500" />
                <span className="text-white font-bold">
                  {request.duration}ms
                </span>
                <span className="text-xs text-gray-400">(Duração Total)</span>
              </div>
              {request.hasError && (
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                  <span className="text-red-400 font-bold">
                    {request.errorType}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Coluna 2: Mini-Trace (Spans) */}
          <div>
            <h4 className="text-sm font-semibold text-gray-400 uppercase mb-4">
              Trace (Spans)
            </h4>
            <div className="space-y-2">
              {request.spans.map((span) => {
                const perc = (span.duration / request.duration) * 100;
                const color = span.service.includes("ui")
                  ? "blue"
                  : span.service.includes("db")
                  ? "purple"
                  : "yellow";
                const statusColor = span.status === "error" ? "red" : color;

                return (
                  <div key={span.id} className="flex items-center gap-2">
                    <span
                      className={`text-${color}-400 font-mono text-sm w-28 truncate`}
                    >
                      {span.service}
                    </span>
                    <div
                      className={`h-2 flex-1 bg-${statusColor}-900/50 rounded-full overflow-hidden`}
                    >
                      <div
                        className={`bg-${statusColor}-500 h-2`}
                        style={{ width: `${perc}%` }}
                      ></div>
                    </div>
                    <span className="text-gray-300 text-sm w-12 text-right">
                      {span.duration}ms
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

// --- Componentes do Painel Inferior (Evoluído) ---
const TraceListTab = ({ traces, onTraceClick }) => {
  return (
    <div className="p-2 text-gray-400">
      <div className="space-y-2 font-mono text-xs">
        {traces.length === 0 && (
          <p className="p-2">Nenhum trace de erro recente.</p>
        )}
        {traces.map((trace) => (
          <div
            key={trace.id}
            onClick={() => onTraceClick(trace)}
            className="p-2 bg-gray-700/50 rounded flex justify-between items-center cursor-pointer hover:bg-gray-700"
          >
            <span className="flex items-center">
              <span className="text-red-400">
                <AlertTriangle className="w-3 h-3 mr-2" />
              </span>
              {trace.traceId}
            </span>
            <span className="truncate w-1/3">{trace.label}</span>
            <span className="text-red-400">{trace.errorType}</span>
            <span className="text-white">{trace.duration}ms</span>
            <ChevronRight className="w-4 h-4" />
          </div>
        ))}
      </div>
    </div>
  );
};

const TraceDetailView = ({ trace, onBack }) => (
  <div className="p-2">
    <button onClick={onBack} className="text-xs text-blue-400 mb-2">
      &larr; Voltar para Traces
    </button>
    <h3 className="text-lg font-bold text-white mb-2 font-sans">
      {trace.label}
    </h3>
    <div className="text-xs font-mono text-gray-400 mb-4">{trace.traceId}</div>
    <div className="space-y-2">
      {trace.spans.map((span) => {
        const perc = (span.duration / trace.duration) * 100;
        const color = span.service.includes("ui")
          ? "blue"
          : span.service.includes("db")
          ? "purple"
          : "yellow";
        const statusColor = span.status === "error" ? "red" : color;
        const Icon = span.service.includes("ui")
          ? IconComponent
          : span.service.includes("db")
          ? DatabaseZap
          : Zap;

        return (
          <div
            key={span.id}
            className="flex items-center gap-3 p-2 bg-gray-800 rounded"
          >
            <Icon className={`w-4 h-4 text-${color}-400`} />
            <span
              className={`font-mono text-sm w-32 truncate text-${color}-400`}
            >
              {span.service}
            </span>
            <div className={`h-4 flex-1 bg-${statusColor}-900/50 rounded`}>
              <div
                className={`bg-${statusColor}-500 h-4 rounded`}
                style={{ width: `${perc}%` }}
              ></div>
            </div>
            <span className="text-gray-300 text-sm w-16 text-right">
              {span.duration}ms
            </span>
            {span.status === "error" && (
              <AlertTriangle className="w-4 h-4 text-red-500" />
            )}
          </div>
        );
      })}
    </div>
  </div>
);

const ErrorListTab = ({ groupedErrors }) => {
  const sortedErrors = Object.entries(groupedErrors).sort(
    (a, b) => b[1].count - a[1].count
  );
  return (
    <div className="p-2 text-gray-400">
      <div className="space-y-2 font-mono text-xs">
        {sortedErrors.length === 0 && (
          <p className="p-2">Nenhum erro agrupado.</p>
        )}
        {sortedErrors.map(([errorType, data]) => (
          <div key={errorType} className="p-2 bg-red-900/50 rounded">
            <div className="flex justify-between items-center">
              <span className="text-red-300 font-bold">{errorType}</span>
              <span className="text-white bg-red-600/50 px-2 py-0.5 rounded-full">
                {data.count} Ocorrências
              </span>
            </div>
            <div className="text-gray-400 mt-1">
              Última em: {data.lastTimestamp.toLocaleTimeString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const PerformanceTab = ({ slowRequests }) => (
  <div className="p-2 text-gray-400">
    <h3 className="text-sm font-semibold text-white mb-2 font-sans uppercase">
      Top 5 Endpoints Lentos (P95)
    </h3>
    <div className="space-y-2 font-mono text-xs">
      {slowRequests.length === 0 && (
        <p className="p-2">Nenhuma requisição lenta registrada.</p>
      )}
      {slowRequests.map((req) => (
        <div
          key={req.id}
          className="p-2 bg-gray-700/50 rounded flex justify-between items-center"
        >
          <span className="text-white truncate w-1/2">{req.label}</span>
          <span className="text-gray-400">{req.user.email}</span>
          <span className="text-yellow-400 font-bold">{req.duration}ms</span>
        </div>
      ))}
    </div>
  </div>
);

const CacheTab = ({ cacheStats }) => (
  <div className="p-4 text-gray-400">
    <h3 className="text-sm font-semibold text-white mb-3 font-sans uppercase">
      Estatísticas de Cache (T1/T2)
    </h3>
    <div className="grid grid-cols-3 gap-4 font-mono text-center">
      <div className="bg-gray-700/50 p-3 rounded-lg">
        <div className="text-2xl font-bold text-white">
          {cacheStats.hits + cacheStats.misses}
        </div>
        <div className="text-xs text-gray-400 uppercase">Total</div>
      </div>
      <div className="bg-green-900/50 p-3 rounded-lg">
        <div className="text-2xl font-bold text-green-400">
          {cacheStats.hits}
        </div>
        <div className="text-xs text-green-400 uppercase">Hits</div>
      </div>
      <div className="bg-yellow-900/50 p-3 rounded-lg">
        <div className="text-2xl font-bold text-yellow-400">
          {cacheStats.misses}
        </div>
        <div className="text-xs text-yellow-400 uppercase">Misses</div>
      </div>
    </div>
    <div className="mt-4 text-center">
      <span className="text-3xl font-bold text-green-400">
        {cacheStats.hits + cacheStats.misses > 0
          ? (
              (cacheStats.hits / (cacheStats.hits + cacheStats.misses)) *
              100
            ).toFixed(0)
          : 0}
        %
      </span>
      <span className="text-gray-400 ml-2">Hit Rate</span>
    </div>
  </div>
);

// --- Componentes da ABA DE ARQUITETURA ---
const ArchitectureTree = ({ architectureData, onNodeClick }) => {
  const [expandedNodes, setExpandedNodes] = useState(new Set(["root"]));

  const toggleNode = (nodeId) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  };

  const renderNode = (node, level = 0) => {
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = expandedNodes.has(node.id);

    return (
      <div key={node.id} className="select-none">
        <div
          className="flex items-center py-1 px-2 hover:bg-gray-800 rounded cursor-pointer"
          style={{ paddingLeft: `${level * 16 + 8}px` }}
          onClick={() => {
            if (hasChildren) toggleNode(node.id);
            if (onNodeClick) onNodeClick(node);
          }}
        >
          {hasChildren ? (
            <ChevronRight
              className={`w-4 h-4 mr-1 transition-transform ${
                isExpanded ? "rotate-90" : ""
              }`}
            />
          ) : (
            <div className="w-4 h-4 mr-1" /> // Placeholder
          )}
          <FileCode className="w-4 h-4 mr-2 text-blue-400" />
          <span className="text-sm text-gray-300">{node.name}</span>
          {node.type && (
            <span className="ml-2 text-xs text-gray-500">({node.type})</span>
          )}
        </div>
        {hasChildren && isExpanded && (
          <div>
            {node.children.map((child) => renderNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="p-4 overflow-auto font-mono">
      {renderNode({
        id: "root",
        name: architectureData.component,
        type: "container",
        children: architectureData.children,
        file: architectureData.file,
      })}
    </div>
  );
};

const FlowView = ({ flows }) => {
  const [expandedFlow, setExpandedFlow] = useState(null);

  return (
    <div className="p-6 space-y-4 overflow-auto">
      <h2 className="text-xl font-bold text-white mb-4">Fluxos Principais</h2>
      {flows.map((flow) => (
        <div
          key={flow.id}
          className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden"
        >
          <button
            onClick={() =>
              setExpandedFlow(expandedFlow === flow.id ? null : flow.id)
            }
            className="w-full p-4 flex items-center justify-between hover:bg-gray-700 transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">{flow.icon}</span>
              <span className="text-lg font-semibold text-white">
                {flow.title}
              </span>
            </div>
            <ChevronRight
              className={`w-5 h-5 text-gray-400 transition-transform ${
                expandedFlow === flow.id ? "rotate-90" : ""
              }`}
            />
          </button>

          {expandedFlow === flow.id && (
            <div className="p-4 border-t border-gray-700 space-y-3">
              {flow.steps.map((step, index) => (
                <React.Fragment key={index}>
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">
                      {index + 1}
                    </div>
                    <div className="flex-1 pt-1">
                      <div className="text-sm font-semibold text-gray-300 mb-1">
                        {step.label}
                      </div>
                      {step.details && (
                        <div className="text-xs text-gray-500 font-mono bg-gray-900/50 p-2 rounded">
                          {step.details}
                        </div>
                      )}
                    </div>
                  </div>
                  {index < flow.steps.length - 1 && (
                    <ArrowDown className="w-4 h-4 text-gray-600 ml-2" />
                  )}
                </React.Fragment>
              ))}
              <div className="mt-4 p-3 bg-green-900/30 border border-green-700 rounded">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <span className="text-sm font-semibold text-green-400">
                    {flow.result}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

const MomentsSidebar = ({ activeMoment, onSelectMoment }) => {
  const moments = [
    { id: "home", name: "Home", icon: Home },
    { id: "admin", name: "Admin", icon: Layout },
  ];
  return (
    <div className="w-64 bg-gray-800/50 border-r border-gray-700 p-4">
      <h3 className="text-sm font-semibold text-gray-400 uppercase mb-4">
        Momentos
      </h3>
      <div className="space-y-2">
        {moments.map((moment) => (
          <button
            key={moment.id}
            onClick={() => onSelectMoment(moment.id)}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left ${
              activeMoment === moment.id
                ? "bg-blue-600 text-white"
                : "text-gray-300 hover:bg-gray-700"
            }`}
          >
            <moment.icon className="w-5 h-5" />
            <span className="text-sm font-medium">{moment.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

const NodeDetailsPanel = ({ node }) => {
  if (!node) {
    return (
      <div className="w-80 bg-gray-800/50 border-l border-gray-700 p-4 overflow-y-auto">
        <div className="flex items-center justify-center h-full text-gray-500">
          <p>Selecione um nó na árvore</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-80 bg-gray-800/50 border-l border-gray-700 p-4 overflow-y-auto">
      <h3 className="text-lg font-bold text-white mb-4">{node.name}</h3>
      <div className="space-y-4">
        <div>
          <h4 className="text-sm font-semibold text-gray-400 mb-2">Tipo</h4>
          <span className="text-sm text-gray-300 font-mono bg-gray-700 px-2 py-1 rounded">
            {node.type}
          </span>
        </div>
        {node.file && (
          <div>
            <h4 className="text-sm font-semibold text-gray-400 mb-2">
              Arquivo
            </h4>
            <code className="text-xs text-blue-400">{node.file}</code>
          </div>
        )}
        {node.props && Object.keys(node.props).length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-gray-400 mb-2">Props</h4>
            <pre className="text-xs text-gray-300 bg-gray-900 p-2 rounded overflow-auto">
              {JSON.stringify(node.props, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};

const ArchitectureExplorerTab = () => {
  const [activeMoment, setActiveMoment] = useState("home");
  const [viewMode, setViewMode] = useState("structure"); // 'structure' | 'flows'
  const [selectedNode, setSelectedNode] = useState(null);

  const currentArchitectureData = SYSTEM_ARCHITECTURE[activeMoment];

  return (
    <div className="flex h-full text-gray-300">
      <MomentsSidebar
        activeMoment={activeMoment}
        onSelectMoment={(moment) => {
          setActiveMoment(moment);
          setSelectedNode(null); // Reseta a seleção
        }}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-shrink-0 flex p-2 bg-gray-900 border-b border-gray-700">
          <div className="flex items-center gap-2 bg-gray-800 rounded-lg p-1">
            <button
              onClick={() => setViewMode("structure")}
              className={`px-4 py-1 rounded-md text-sm font-medium ${
                viewMode === "structure"
                  ? "bg-blue-600 text-white"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              Estrutura
            </button>
            <button
              onClick={() => setViewMode("flows")}
              className={`px-4 py-1 rounded-md text-sm font-medium ${
                viewMode === "flows"
                  ? "bg-blue-600 text-white"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              Fluxos
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto">
          {viewMode === "structure" ? (
            <ArchitectureTree
              architectureData={currentArchitectureData}
              onNodeClick={setSelectedNode}
            />
          ) : (
            <FlowView flows={FLOWS_DATA} />
          )}
        </div>
      </div>

      <NodeDetailsPanel node={selectedNode} />
    </div>
  );
};

// O novo painel com abas
const TabbedPanel = ({ logs, observabilityData }) => {
  const [activeTab, setActiveTab] = useState("logs");
  const [selectedTrace, setSelectedTrace] = useState(null);

  const { allRequests, groupedErrors, cacheStats } = observabilityData;

  const recentTraces = allRequests.filter((r) => r.hasError).slice(-10);
  const slowRequests = [...allRequests]
    .sort((a, b) => b.duration - a.duration)
    .slice(0, 5);

  const tabs = [
    { id: "logs", label: "Logs", icon: Logs },
    { id: "traces", label: "Traces", icon: Activity },
    { id: "errors", label: "Errors", icon: Bug },
    { id: "performance", label: "Performance", icon: Gauge },
    { id: "cache", label: "Cache", icon: Archive },
    { id: "architecture", label: "Architecture", icon: Layers },
  ];

  useEffect(() => {
    if (activeTab !== "traces") {
      setSelectedTrace(null);
    }
  }, [activeTab]);

  return (
    <div className="flex-shrink-0 h-64 bg-gray-900/90 border-t border-gray-700/50 shadow-inner backdrop-blur-sm flex flex-col">
      <div className="flex items-center border-b border-gray-700/50 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors flex-shrink-0
                ${
                  activeTab === tab.id
                    ? "bg-gray-800 text-white"
                    : "text-gray-400 hover:text-white hover:bg-gray-800/50"
                }
              `}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-auto p-0 log-panel">
        {activeTab === "logs" && (
          <div className="space-y-2 font-mono text-xs p-3">
            {logs.length === 0 && (
              <p className="text-gray-500">Aguardando dados...</p>
            )}
            {logs.map((log, i) => (
              <div key={i} className="flex">
                <span className="text-gray-500 mr-2 flex-shrink-0">
                  {log.timestamp}
                </span>
                <span
                  className={`
                    ${log.type === "error" ? "text-red-400" : ""}
                    ${log.type === "success" ? "text-green-400" : ""}
                    ${log.type === "warning" ? "text-yellow-400" : ""}
                    ${log.type === "system" ? "text-blue-400" : "text-gray-300"}
                  `}
                >
                  {log.message}
                </span>
              </div>
            ))}
          </div>
        )}
        {activeTab === "traces" && (
          <div className="p-3">
            {selectedTrace ? (
              <TraceDetailView
                trace={selectedTrace}
                onBack={() => setSelectedTrace(null)}
              />
            ) : (
              <TraceListTab
                traces={recentTraces}
                onTraceClick={setSelectedTrace}
              />
            )}
          </div>
        )}
        {activeTab === "errors" && (
          <div className="p-3">
            <ErrorListTab groupedErrors={groupedErrors} />
          </div>
        )}
        {activeTab === "performance" && (
          <div className="p-3">
            <PerformanceTab slowRequests={slowRequests} />
          </div>
        )}
        {activeTab === "cache" && (
          <div className="p-3">
            <CacheTab cacheStats={cacheStats} />
          </div>
        )}
        {activeTab === "architecture" && <ArchitectureExplorerTab />}
      </div>
    </div>
  );
};

// --- Lógica Principal de Observabilidade (Hook) ---
function useObservability(filters) {
  const [globalMetrics, setGlobalMetrics] = useState({
    health: 100,
    latencyP95: 350,
    errorRate: 0,
    activeUsers: 100,
  });
  const [requests, setRequests] = useState([]); // Pipeline visual
  const [logs, setLogs] = useState([]);

  const [allRequests, setAllRequests] = useState([]); // Histórico para performance
  const [groupedErrors, setGroupedErrors] = useState({}); // Para aba de Erros
  const [cacheStats, setCacheStats] = useState({ hits: 0, misses: 0 });

  const requestInterval = useRef(null);
  const metricsInterval = useRef(null);

  const addLog = useCallback((message, type = "info") => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs((prev) => [{ timestamp, message, type }, ...prev.slice(0, 100)]);
  }, []);

  const processRequest = (req) => {
    setRequests((prev) => [...prev, req]);

    setAllRequests((prev) => [req, ...prev.slice(0, 200)]);
    if (req.cacheStatus === "hit") {
      setCacheStats((prev) => ({ ...prev, hits: prev.hits + 1 }));
    } else if (req.cacheStatus === "miss") {
      setCacheStats((prev) => ({ ...prev, misses: prev.misses + 1 }));
    }

    setTimeout(
      () =>
        setRequests((prev) =>
          prev.map((r) =>
            r.id === req.id ? { ...r, status: "running", stage: 1 } : r
          )
        ),
      500
    ); // Validation
    setTimeout(
      () =>
        setRequests((prev) =>
          prev.map((r) =>
            r.id === req.id ? { ...r, status: "running", stage: 3 } : r
          )
        ),
      1000
    ); // Request Engine
    setTimeout(
      () =>
        setRequests((prev) =>
          prev.map((r) =>
            r.id === req.id ? { ...r, status: "running", stage: 4 } : r
          )
        ),
      1000 + req.duration
    ); // Normalization

    setTimeout(() => {
      const finalStatus = req.hasError ? "failed" : "done";
      setRequests((prev) =>
        prev.map((r) =>
          r.id === req.id ? { ...r, status: finalStatus, stage: 6 } : r
        )
      );

      if (req.hasError) {
        addLog(
          `Req ${req.id} (${req.label}) falhou: ${req.errorType}`,
          "error"
        );
        setGroupedErrors((prev) => {
          const newErrors = { ...prev };
          const errorKey = req.errorType || "Unknown Error";
          if (newErrors[errorKey]) {
            newErrors[errorKey].count++;
            newErrors[errorKey].lastTimestamp = new Date();
          } else {
            newErrors[errorKey] = { count: 1, lastTimestamp: new Date() };
          }
          return newErrors;
        });
      } else {
        addLog(
          `Req ${req.id} (${req.label}) concluída em ${req.duration}ms.`,
          "success"
        );
      }

      setTimeout(
        () => setRequests((prev) => prev.filter((r) => r.id !== req.id)),
        2000
      );
    }, 1500 + req.duration);
  };

  const cleanupIntervals = () => {
    if (requestInterval.current) clearInterval(requestInterval.current);
    if (metricsInterval.current) clearInterval(metricsInterval.current);
  };

  useEffect(() => {
    if (filters.autoRefresh) {
      const intervalTime = filters.period === "5m" ? 2000 : 5000;
      requestInterval.current = setInterval(() => {
        const newReq = createMockRequest();
        if (filters.severity === "errors" && !newReq.hasError) {
          // Pula
        } else {
          processRequest(newReq);
        }
      }, intervalTime);

      metricsInterval.current = setInterval(() => {
        setAllRequests((prevAllRequests) => {
          const cutoff = Date.now() - 60 * 1000 * 5; // 5 min
          const freshAllRequests = prevAllRequests.filter(
            (r) => r.timestamp.getTime() > cutoff
          );

          setGlobalMetrics((prevMetrics) => {
            const recentRequests = freshAllRequests.slice(0, 50);
            const errorCount = recentRequests.filter((r) => r.hasError).length;
            const errorRate =
              recentRequests.length > 0
                ? (errorCount / recentRequests.length) * 100
                : 0;

            const latencies = recentRequests
              .filter((r) => !r.hasError)
              .map((r) => r.duration);
            latencies.sort((a, b) => a - b);
            const p95Index = Math.floor(latencies.length * 0.95);
            const latencyP95 = latencies[p95Index] || 0;

            const health = Math.max(
              70,
              Math.min(100, 100 - errorRate * 2 - latencyP95 / 100)
            );

            return {
              health: health,
              latencyP95: latencyP95,
              errorRate: errorRate,
              activeUsers: Math.max(
                50,
                Math.min(
                  300,
                  prevMetrics.activeUsers + (Math.random() - 0.5) * 10
                )
              ),
            };
          });
          return freshAllRequests;
        });
      }, 3000);
    } else {
      cleanupIntervals();
    }
    return cleanupIntervals;
  }, [filters.autoRefresh, filters.period, filters.severity, addLog]);

  const observabilityData = { allRequests, groupedErrors, cacheStats };

  return { globalMetrics, requests, logs, observabilityData };
}

// --- Componente Header (Refatorado) ---
const Header = ({ metrics, filters, setFilters }) => {
  const getHealthColor = (score) => {
    if (score > 95) return "text-green-400";
    if (score > 80) return "text-yellow-400";
    return "text-red-400";
  };
  const getLatencyColor = (p95) => {
    if (p95 < 500) return "text-green-400";
    if (p95 < 1500) return "text-yellow-400";
    return "text-red-400";
  };

  const { autoRefresh } = filters;
  const setAutoRefresh = (value) =>
    setFilters((f) => ({ ...f, autoRefresh: value }));

  return (
    <header className="flex-shrink-0 bg-gray-900/80 border-b border-gray-700/50 shadow-md backdrop-blur-sm z-10">
      {/* Linha 1: Título e Métricas Globais */}
      <div className="flex items-center justify-between p-4">
        <h1 className="text-xl font-bold text-white">Super Monitor</h1>

        <div className="flex items-center space-x-6 font-mono text-sm">
          <div className="flex items-center">
            <HeartPulse
              className={`w-5 h-5 mr-2 ${getHealthColor(metrics.health)}`}
            />
            <span className="text-gray-400 mr-1">Health:</span>
            <span className={`font-bold ${getHealthColor(metrics.health)}`}>
              {metrics.health.toFixed(0)}%
            </span>
          </div>
          <div className="flex items-center">
            <Gauge
              className={`w-5 h-5 mr-2 ${getLatencyColor(metrics.latencyP95)}`}
            />
            <span className="text-gray-400 mr-1">Latência P95:</span>
            <span
              className={`font-bold ${getLatencyColor(metrics.latencyP95)}`}
            >
              {metrics.latencyP95.toFixed(0)}ms
            </span>
          </div>
          <div className="flex items-center">
            <AlertTriangle
              className={`w-5 h-5 mr-2 ${
                metrics.errorRate > 5 ? "text-red-400" : "text-gray-400"
              }`}
            />
            <span className="text-gray-400 mr-1">Taxa de Erro:</span>
            <span
              className={`font-bold ${
                metrics.errorRate > 5 ? "text-red-400" : "text-gray-300"
              }`}
            >
              {metrics.errorRate.toFixed(1)}%
            </span>
          </div>
          <div className="flex items-center">
            <Users className="w-5 h-5 mr-2 text-blue-400" />
            <span className="text-gray-400 mr-1">Usuários Ativos:</span>
            <span className="font-bold text-gray-300">
              {metrics.activeUsers.toFixed(0)}
            </span>
          </div>
        </div>
      </div>

      {/* Linha 2: Controlos */}
      <div className="flex items-center justify-between p-3 bg-gray-950/50 border-t border-gray-700/50">
        <div className="flex items-center gap-6">
          <SegmentedControl
            label={{ icon: <Server className="w-4 h-4" />, text: "Ambiente" }}
            options={[
              { value: "prod", label: "Prod" },
              { value: "staging", label: "Staging" },
            ]}
            selected={filters.environment}
            setSelected={(value) =>
              setFilters((f) => ({ ...f, environment: value }))
            }
          />
          <SegmentedControl
            label={{ icon: <Calendar className="w-4 h-4" />, text: "Período" }}
            options={[
              { value: "5m", label: "5 Min" },
              { value: "1h", label: "1 Hora" },
              { value: "24h", label: "24 Horas" },
            ]}
            selected={filters.period}
            setSelected={(value) =>
              setFilters((f) => ({ ...f, period: value }))
            }
          />
          <SegmentedControl
            label={{ icon: <Filter className="w-4 h-4" />, text: "Severidade" }}
            options={[
              { value: "all", label: "Todos" },
              { value: "errors", label: "Erros" },
            ]}
            selected={filters.severity}
            setSelected={(value) =>
              setFilters((f) => ({ ...f, severity: value }))
            }
          />
        </div>

        <button
          onClick={() => setAutoRefresh(!autoRefresh)}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold
              ${
                autoRefresh
                  ? "bg-green-600/20 text-green-400 hover:bg-green-600/30"
                  : "bg-gray-700 text-gray-400 hover:bg-gray-600"
              }`}
        >
          <Power className={`w-4 h-4 ${autoRefresh ? "animate-pulse" : ""}`} />
          {autoRefresh ? "Auto-Refresh (On)" : "Auto-Refresh (Off)"}
        </button>
      </div>
    </header>
  );
};

// --- COMPONENTE PRINCIPAL (App) ---
export default function App() {
  const [filters, setFilters] = useState({
    environment: "prod",
    period: "5m",
    autoRefresh: true,
    severity: "all",
  });

  const { globalMetrics, requests, logs, observabilityData } =
    useObservability(filters);
  const [selectedRequest, setSelectedRequest] = useState(null);

  const stages = [
    requests.filter((r) => r.stage === 0), // Input
    requests.filter((r) => r.stage === 1 || r.stage === 2), // Validation / Prep
    requests.filter((r) => r.stage === 3), // Request Engine
    requests.filter((r) => r.stage === 4), // Normalization
    requests.filter((r) => r.stage === 5), // Storage (Cache)
    requests.filter((r) => r.stage === 6), // Output
  ];

  const stageDefs = [
    {
      title: "Input",
      icon: <ChevronRight className="w-5 h-5 text-gray-500" />,
    },
    {
      title: "Validation",
      icon: <CheckCircle className="w-5 h-5 text-blue-500" />,
    },
    {
      title: "Request Engine",
      icon: <Zap className="w-5 h-5 text-yellow-500" />,
    },
    {
      title: "Normalization",
      icon: <Settings className="w-5 h-5 text-indigo-500" />,
    },
    { title: "Storage", icon: <Archive className="w-5 h-5 text-purple-500" /> },
    {
      title: "Output",
      icon: <ArrowRight className="w-5 h-5 text-green-500" />,
    },
  ];

  return (
    // Layout principal alterado para flex-col
    <div className="flex flex-col h-screen bg-gray-950 text-white font-sans overflow-hidden">
      <style jsx="true" global="true">{`
        body {
          background-color: #030712; /* bg-gray-950 */
        }
        /* Estilização da Scrollbar */
        ::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        ::-webkit-scrollbar-track {
          background: #111827; /* bg-gray-900 */
        }
        ::-webkit-scrollbar-thumb {
          background: #4b5563; /* bg-gray-600 */
          border-radius: 4px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: #6b7280; /* bg-gray-500 */
        }

        /* Cores dinâmicas (Tailwind purge) */
        .border-green-500,
        .text-green-400,
        .bg-green-900\/50,
        .bg-green-500,
        .animate-pulse {
        }
        .border-yellow-500,
        .text-yellow-400,
        .bg-yellow-900\/50,
        .bg-yellow-500 {
        }
        .border-red-500,
        .text-red-400,
        .bg-red-900\/50,
        .bg-red-500 {
        }
        .text-blue-400,
        .bg-blue-900\/50,
        .bg-blue-500 {
        }
        .text-purple-400,
        .bg-purple-900\/50,
        .bg-purple-500 {
        }
      `}</style>

      {/* NOVO HEADER INTELIGENTE (substitui a Sidebar) */}
      <Header
        metrics={globalMetrics}
        filters={filters}
        setFilters={setFilters}
      />

      {/* PAINEL PRINCIPAL (Pipeline + Abas) */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Pipeline (Centro) */}
        <div className="flex-1 flex overflow-x-auto bg-grid-pattern">
          <AnimatePresence>
            {stageDefs.map((stage, index) => (
              <StageColumn
                key={stage.title}
                title={stage.title}
                icon={stage.icon}
                count={stages[index].length}
              >
                <AnimatePresence>
                  {stages[index].map((req) => (
                    <RequestDot
                      key={req.id}
                      request={req}
                      onClick={() => setSelectedRequest(req)}
                    />
                  ))}
                </AnimatePresence>
              </StageColumn>
            ))}
          </AnimatePresence>
        </div>

        {/* Painel Inferior (Logs + Abas) */}
        <TabbedPanel logs={logs} observabilityData={observabilityData} />
      </main>

      {/* Fundo */}
      <div
        className="absolute inset-0 -z-10 h-full w-full bg-gray-950 bg-[radial-gradient(#1f2937_1px,transparent_1px)] [background-size:32px_32px]"
        style={{ opacity: 0.3 }}
      ></div>

      {/* MODAL DE DETALHES (flutuante) */}
      <AnimatePresence>
        {selectedRequest && (
          <RequestDetailModal
            request={selectedRequest}
            onClose={() => setSelectedRequest(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
