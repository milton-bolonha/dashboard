"use client";

import type { RequestData } from "./metrics-storage";
import { loadStoredMetrics } from "./metrics-storage";

export interface ActionType {
  id: string;
  name: string;
  icon: string;
  endpoint: string;
  method: string;
}

export const ACTION_TYPES: ActionType[] = [
  {
    id: "create-workspace",
    name: "Forms Enviados",
    icon: "📤",
    endpoint: "/api/generate",
    method: "POST",
  },
  {
    id: "create-tile",
    name: "Tiles Criados",
    icon: "🎴",
    endpoint: "/api/workspace/tiles",
    method: "POST",
  },
  {
    id: "regenerate-tile",
    name: "Tiles Regenerados",
    icon: "🔄",
    endpoint: "/api/workspace/tiles",
    method: "POST",
    // Note: precisa verificar se tem /regenerate no URL
  },
  {
    id: "tile-chat",
    name: "Chats em Tiles",
    icon: "💬",
    endpoint: "/api/workspace/tiles",
    method: "POST",
    // Note: precisa verificar se tem /chat no URL
  },
  {
    id: "create-contact",
    name: "Contatos Criados",
    icon: "👤",
    endpoint: "/api/workspace/contacts",
    method: "POST",
  },
  {
    id: "create-note",
    name: "Notas Criadas",
    icon: "📝",
    endpoint: "/api/workspace/notes",
    method: "POST",
  },
  {
    id: "create-dashboard",
    name: "Dashboards Criados",
    icon: "📊",
    endpoint: "/api/dashboards",
    method: "POST",
  },
  {
    id: "delete-tile",
    name: "Tiles Deletados",
    icon: "🗑️",
    endpoint: "/api/workspace/tiles",
    method: "DELETE",
  },
];

export interface ActionStatistics {
  actionId: string;
  actionName: string;
  icon: string;
  count: number;
  successCount: number;
  errorCount: number;
  avgDuration: number;
  lastExecuted: number | null;
}

function categorizeRequest(request: RequestData): string | null {
  const url = request.url || "";
  const method = request.method || "";

  // Criar Workspace (Form) - POST /api/generate
  if (url.includes("/api/generate") && method === "POST") {
    return "create-workspace";
  }

  // Regenerar Tile - POST /api/workspace/tiles/[id]/regenerate
  if (url.includes("/api/workspace/tiles") && url.includes("/regenerate") && method === "POST") {
    return "regenerate-tile";
  }

  // Chat em Tile - POST /api/workspace/tiles/[id]/chat
  if (url.includes("/api/workspace/tiles") && url.includes("/chat") && method === "POST") {
    return "tile-chat";
  }

  // Criar Tile Individual - POST /api/workspace/tiles (sem /regenerate ou /chat)
  if (url.includes("/api/workspace/tiles") && method === "POST" && !url.includes("/regenerate") && !url.includes("/chat")) {
    return "create-tile";
  }

  // Deletar Tile - DELETE /api/workspace/tiles/[id]
  if (url.includes("/api/workspace/tiles") && method === "DELETE") {
    return "delete-tile";
  }

  // Criar Contato - POST /api/workspace/contacts
  if (url.includes("/api/workspace/contacts") && method === "POST" && !url.includes("/chat") && !url.includes("/regenerate")) {
    return "create-contact";
  }

  // Criar Nota - POST /api/workspace/notes
  if (url.includes("/api/workspace/notes") && method === "POST") {
    return "create-note";
  }

  // Criar Dashboard - POST /api/dashboards (detectar quando cria novo dashboard)
  // Nota: Isso pode ser melhorado verificando o body da requisição, mas por enquanto
  // assumimos que POST em /api/dashboards cria/atualiza dashboard
  if (url.includes("/api/dashboards") && method === "POST") {
    return "create-dashboard";
  }

  return null;
}

export function getActionStatistics(requests: RequestData[]): ActionStatistics[] {
  const statsMap = new Map<string, {
    count: number;
    successCount: number;
    errorCount: number;
    totalDuration: number;
    lastExecuted: number | null;
  }>();

  // Processar todas as requisições
  requests.forEach((req) => {
    const actionId = categorizeRequest(req);
    if (!actionId) return;

    const current = statsMap.get(actionId) || {
      count: 0,
      successCount: 0,
      errorCount: 0,
      totalDuration: 0,
      lastExecuted: null,
    };

    current.count++;
    if (req.hasError) {
      current.errorCount++;
    } else {
      current.successCount++;
    }
    current.totalDuration += req.duration;
    
    if (!current.lastExecuted || req.timestamp > current.lastExecuted) {
      current.lastExecuted = req.timestamp;
    }

    statsMap.set(actionId, current);
  });

  // Converter para array de estatísticas
  return ACTION_TYPES.map((actionType) => {
    const stats = statsMap.get(actionType.id) || {
      count: 0,
      successCount: 0,
      errorCount: 0,
      totalDuration: 0,
      lastExecuted: null,
    };

    return {
      actionId: actionType.id,
      actionName: actionType.name,
      icon: actionType.icon,
      count: stats.count,
      successCount: stats.successCount,
      errorCount: stats.errorCount,
      avgDuration: stats.count > 0 ? Math.round(stats.totalDuration / stats.count) : 0,
      lastExecuted: stats.lastExecuted,
    };
  }).filter((stat) => stat.count > 0); // Apenas ações que foram executadas
}

export function getTotalStatistics(): {
  totalRequests: number;
  totalSuccess: number;
  totalErrors: number;
  actionStats: ActionStatistics[];
} {
  const data = loadStoredMetrics();
  const requests = data.requests || [];
  
  const actionStats = getActionStatistics(requests);
  const totalRequests = requests.length;
  const totalSuccess = requests.filter((r) => !r.hasError).length;
  const totalErrors = requests.filter((r) => r.hasError).length;

  return {
    totalRequests,
    totalSuccess,
    totalErrors,
    actionStats,
  };
}

