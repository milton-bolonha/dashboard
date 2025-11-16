"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Settings,
  Zap,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Archive,
  ArrowRight,
  Loader,
  Logs,
  ChevronRight,
  HeartPulse,
  Users,
  Bug,
  Gauge,
  Server,
  Clock,
  X,
  Filter,
  Calendar,
  Power,
  Activity,
} from "lucide-react";
import Link from "next/link";
import { interceptRequests, restoreRequests } from "@/lib/test/request-interceptor";
import { interceptConsole, restoreConsole, fetchServerLogs } from "@/lib/test/log-collector";
import { loadStoredMetrics, updateMetrics, clearMetrics } from "@/lib/test/metrics-storage";
import { loadStoredLogs, clearLogs } from "@/lib/test/logs-storage";
import { loadStoredConfig, updateFilters } from "@/lib/test/config-storage";
import { calculateMetrics, getTopSlowEndpoints, getErrorGroups } from "@/lib/test/performance-tracker";
import { getTotalStatistics } from "@/lib/test/usage-statistics";
import { runStressTest } from "@/lib/test/stress-controller";
import { simulateFullVisit } from "@/lib/test/visit-simulator";
import { SecurityWarning } from "@/lib/test/security-warning";
import { isLoggingEnabled } from "@/lib/test/security-sanitizer";
import type { RequestData, MetricsData } from "@/lib/test/metrics-storage";
import type { LogEntry } from "@/lib/test/logs-storage";
import type { TestFilters } from "@/lib/test/config-storage";

// Componentes de UI
const SegmentedControl = ({
  label,
  options,
  selected,
  setSelected,
  disabled = false,
}: {
  label: { icon: React.ReactNode; text: string };
  options: Array<{ value: string; label: string }>;
  selected: string;
  setSelected: (value: string) => void;
  disabled?: boolean;
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

const StageColumn = ({
  title,
  icon,
  children,
  count,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  count: number;
}) => (
  <div className="flex-1 flex flex-col min-w-[200px] p-4 border-r border-gray-800">
    <div className="flex items-center justify-between text-gray-400 mb-4 pb-2 border-b border-gray-800">
      <div className="flex items-center min-w-0">
        {icon}
        <h3 className="text-sm font-semibold uppercase ml-2 truncate">{title}</h3>
      </div>
      <span className="text-xs font-mono bg-gray-700/50 text-gray-300 rounded-full px-2 py-0.5">
        {count}
      </span>
    </div>
    <div className="flex-grow h-full space-y-2 overflow-y-auto pr-1">{children}</div>
  </div>
);

const RequestDot = ({
  request,
  onClick,
}: {
  request: RequestData;
  onClick: () => void;
}) => {
  const statusConfig = {
    pending: {
      bgColor: "bg-gray-500",
      borderColor: "border-gray-400",
      icon: request.icon,
    },
    running: {
      bgColor: "bg-blue-500",
      borderColor: "border-blue-400",
      icon: <Loader className="w-3 h-3 text-white animate-spin" />,
    },
    done: {
      bgColor: "bg-green-500",
      borderColor: "border-green-400",
      icon: <CheckCircle className="w-3 h-3 text-white" />,
    },
    failed: {
      bgColor: "bg-red-500",
      borderColor: "border-red-400",
      icon: <XCircle className="w-3 h-3 text-white" />,
    },
  }[request.status];

  return (
    <motion.div
      layout
      onClick={onClick}
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.5 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className={`w-full p-2 rounded-lg flex items-center shadow-md ${statusConfig.bgColor} border ${statusConfig.borderColor} cursor-pointer hover:shadow-lg hover:scale-105 transition-all`}
    >
      {statusConfig.icon && (
        <div className="flex-shrink-0 w-4 h-4 mr-2 flex items-center justify-center text-white text-base">
          {typeof statusConfig.icon === "string" ? statusConfig.icon : statusConfig.icon}
        </div>
      )}
      <span className="text-xs font-medium text-white truncate">{request.label}</span>
      <span className="text-xs text-white/70 ml-auto flex-shrink-0">{request.id}</span>
    </motion.div>
  );
};

const RequestDetailModal = ({
  request,
  onClose,
}: {
  request: RequestData;
  onClose: () => void;
}) => {
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
            <span className={`text-2xl ${request.hasError ? "text-red-500" : "text-green-500"}`}>
              {request.hasError ? <XCircle /> : <CheckCircle />}
            </span>
            <div>
              <h3 className="text-lg font-bold text-white">{request.label}</h3>
              <span className="text-sm text-gray-400 font-mono">ID: {request.traceId}</span>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </header>
        <div className="p-6 grid grid-cols-2 gap-6">
          <div>
            <h4 className="text-sm font-semibold text-gray-400 uppercase mb-3">Detalhes</h4>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-gray-500" />
                <span className="text-white">{new Date(request.timestamp).toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-3">
                <Gauge className="w-5 h-5 text-gray-500" />
                <span className="text-white font-bold">{request.duration}ms</span>
                <span className="text-xs text-gray-400">(Duração Total)</span>
              </div>
              {request.hasError && (
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                  <span className="text-red-400 font-bold">{request.errorType}</span>
                </div>
              )}
            </div>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-gray-400 uppercase mb-4">Trace (Spans)</h4>
            <div className="space-y-2">
              {request.spans?.map((span) => {
                const perc = (span.duration / request.duration) * 100;
                const isUI = span.service.includes("ui");
                const isDB = span.service.includes("db");
                const isError = span.status === "error";
                const colorClass = isUI ? "text-blue-400" : isDB ? "text-purple-400" : "text-yellow-400";
                const bgClass = isError ? "bg-red-900/50" : isUI ? "bg-blue-900/50" : isDB ? "bg-purple-900/50" : "bg-yellow-900/50";
                const barClass = isError ? "bg-red-500" : isUI ? "bg-blue-500" : isDB ? "bg-purple-500" : "bg-yellow-500";
                return (
                  <div key={span.id} className="flex items-center gap-2">
                    <span className={`${colorClass} font-mono text-sm w-28 truncate`}>{span.service}</span>
                    <div className={`h-2 flex-1 ${bgClass} rounded-full overflow-hidden`}>
                      <div className={`${barClass} h-2`} style={{ width: `${perc}%` }}></div>
                    </div>
                    <span className="text-gray-300 text-sm w-12 text-right">{span.duration}ms</span>
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

// Hook de Observabilidade
function useObservability(filters: TestFilters) {
  const [globalMetrics, setGlobalMetrics] = useState<MetricsData>({
    health: 100,
    latencyP95: 0,
    errorRate: 0,
    activeUsers: 0,
    timestamp: Date.now(),
  });
  const [requests, setRequests] = useState<RequestData[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [allRequests, setAllRequests] = useState<RequestData[]>([]);
  const [groupedErrors, setGroupedErrors] = useState<Record<string, { count: number; lastTimestamp: Date }>>({});
  const [cacheStats, setCacheStats] = useState({ hits: 0, misses: 0 });

  const metricsInterval = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Carregar dados iniciais do localStorage
    const storedMetrics = loadStoredMetrics();
    const storedLogs = loadStoredLogs();
    
    if (storedMetrics.requests.length > 0) {
      setAllRequests(storedMetrics.requests);
      setRequests(storedMetrics.requests.slice(-20)); // Últimas 20 para pipeline
    }
    
    if (storedMetrics.metrics) {
      setGlobalMetrics(storedMetrics.metrics);
    }
    
    setCacheStats(storedMetrics.cacheStats);
    setLogs(storedLogs.logs.slice(-100));

    // Atualizar métricas periodicamente
    if (filters.autoRefresh) {
      metricsInterval.current = setInterval(() => {
        const data = loadStoredMetrics();
        const metrics = calculateMetrics(data.requests);
        setGlobalMetrics(metrics);
        updateMetrics(metrics);
        
        // Atualizar cache stats
        setCacheStats(data.cacheStats);
        
        // Atualizar erros agrupados
        const errors = getErrorGroups(data.requests);
        setGroupedErrors(errors);
        
        // Atualizar requests do pipeline (últimas 20)
        setRequests(data.requests.slice(-20));
        setAllRequests(data.requests);
        
        // Buscar logs do servidor
        fetchServerLogs(50).then((serverLogs) => {
          setLogs((prev) => [...serverLogs, ...prev].slice(-100));
        });
      }, 3000);
    }

    return () => {
      if (metricsInterval.current) {
        clearInterval(metricsInterval.current);
      }
    };
  }, [filters.autoRefresh, filters.period]);

  const observabilityData = { allRequests, groupedErrors, cacheStats };

  return { globalMetrics, requests, logs, observabilityData };
}

// Componente Header
const Header = ({
  metrics,
  filters,
  setFilters,
}: {
  metrics: MetricsData;
  filters: TestFilters;
  setFilters: (f: TestFilters | ((prev: TestFilters) => TestFilters)) => void;
}) => {
  const getHealthColor = (score: number) => {
    if (score > 95) return "text-green-400";
    if (score > 80) return "text-yellow-400";
    return "text-red-400";
  };
  const getLatencyColor = (p95: number) => {
    if (p95 < 500) return "text-green-400";
    if (p95 < 1500) return "text-yellow-400";
    return "text-red-400";
  };

  const handleFilterChange = (key: keyof TestFilters, value: unknown) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    updateFilters({ [key]: value });
  };

  return (
    <header className="flex-shrink-0 bg-gray-900/80 border-b border-gray-700/50 shadow-md backdrop-blur-sm z-10">
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold text-white">Test Dashboard</h1>
          <Link href="/test-limits" className="text-sm text-blue-400 hover:text-blue-300">
            → Test Limits
          </Link>
        </div>
        <div className="flex items-center space-x-6 font-mono text-sm">
          <div className="flex items-center">
            <HeartPulse className={`w-5 h-5 mr-2 ${getHealthColor(metrics.health)}`} />
            <span className="text-gray-400 mr-1">Health:</span>
            <span className={`font-bold ${getHealthColor(metrics.health)}`}>{metrics.health.toFixed(0)}%</span>
          </div>
          <div className="flex items-center">
            <Gauge className={`w-5 h-5 mr-2 ${getLatencyColor(metrics.latencyP95)}`} />
            <span className="text-gray-400 mr-1">Latência P95:</span>
            <span className={`font-bold ${getLatencyColor(metrics.latencyP95)}`}>{metrics.latencyP95.toFixed(0)}ms</span>
          </div>
          <div className="flex items-center">
            <AlertTriangle className={`w-5 h-5 mr-2 ${metrics.errorRate > 5 ? "text-red-400" : "text-gray-400"}`} />
            <span className="text-gray-400 mr-1">Taxa de Erro:</span>
            <span className={`font-bold ${metrics.errorRate > 5 ? "text-red-400" : "text-gray-300"}`}>
              {metrics.errorRate.toFixed(1)}%
            </span>
          </div>
          <div className="flex items-center">
            <Users className="w-5 h-5 mr-2 text-blue-400" />
            <span className="text-gray-400 mr-1">Usuários Ativos:</span>
            <span className="font-bold text-gray-300">{metrics.activeUsers.toFixed(0)}</span>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between p-3 bg-gray-950/50 border-t border-gray-700/50">
        <div className="flex items-center gap-6">
          <SegmentedControl
            label={{ icon: <Server className="w-4 h-4" />, text: "Ambiente" }}
            options={[{ value: "dev", label: "Dev" }, { value: "prod", label: "Prod" }]}
            selected={filters.environment}
            setSelected={(value) => handleFilterChange("environment", value)}
          />
          <SegmentedControl
            label={{ icon: <Calendar className="w-4 h-4" />, text: "Período" }}
            options={[{ value: "5m", label: "5 Min" }, { value: "1h", label: "1 Hora" }, { value: "24h", label: "24 Horas" }]}
            selected={filters.period}
            setSelected={(value) => handleFilterChange("period", value)}
          />
          <SegmentedControl
            label={{ icon: <Filter className="w-4 h-4" />, text: "Severidade" }}
            options={[{ value: "all", label: "Todos" }, { value: "errors", label: "Erros" }]}
            selected={filters.severity}
            setSelected={(value) => handleFilterChange("severity", value)}
          />
        </div>
        <button
          onClick={() => handleFilterChange("autoRefresh", !filters.autoRefresh)}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold
              ${
                filters.autoRefresh
                  ? "bg-green-600/20 text-green-400 hover:bg-green-600/30"
                  : "bg-gray-700 text-gray-400 hover:bg-gray-600"
              }`}
        >
          <Power className={`w-4 h-4 ${filters.autoRefresh ? "animate-pulse" : ""}`} />
          {filters.autoRefresh ? "Auto-Refresh (On)" : "Auto-Refresh (Off)"}
        </button>
      </div>
    </header>
  );
};

// Componentes de Abas (simplificados)
const TabbedPanel = ({
  logs,
  observabilityData,
}: {
  logs: LogEntry[];
  observabilityData: { allRequests: RequestData[]; groupedErrors: Record<string, { count: number; lastTimestamp: Date }>; cacheStats: { hits: number; misses: number } };
}) => {
  const [activeTab, setActiveTab] = useState("logs");
  const slowRequests = getTopSlowEndpoints(observabilityData.allRequests, 5);
  const sortedErrors = Object.entries(observabilityData.groupedErrors).sort((a, b) => b[1].count - a[1].count);
  const usageStats = getTotalStatistics();

  const tabs = [
    { id: "logs", label: "Logs", icon: Logs },
    { id: "statistics", label: "Estatísticas", icon: Activity },
    { id: "performance", label: "Performance", icon: Gauge },
    { id: "errors", label: "Errors", icon: Bug },
    { id: "cache", label: "Cache", icon: Archive },
  ];

  return (
    <div className="flex-shrink-0 h-64 bg-gray-900/90 border-t border-gray-700/50 shadow-inner backdrop-blur-sm flex flex-col">
      <div className="flex items-center border-b border-gray-700/50 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors flex-shrink-0
                ${activeTab === tab.id ? "bg-gray-800 text-white" : "text-gray-400 hover:text-white hover:bg-gray-800/50"}`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-auto p-3">
        {activeTab === "logs" && (
          <div className="space-y-2 font-mono text-xs">
            {logs.length === 0 && <p className="text-gray-500">Aguardando dados...</p>}
            {logs.map((log, i) => (
              <div key={i} className="flex">
                <span className="text-gray-500 mr-2 flex-shrink-0">{log.timestamp}</span>
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
        {activeTab === "statistics" && (
          <div className="p-4 text-gray-400">
            <h3 className="text-sm font-semibold text-white mb-4 font-sans uppercase">Estatísticas de Uso</h3>
            
            <div className="grid grid-cols-3 gap-4 mb-6 font-mono text-center">
              <div className="bg-gray-700/50 p-3 rounded-lg">
                <div className="text-2xl font-bold text-white">{usageStats.totalRequests}</div>
                <div className="text-xs text-gray-400 uppercase">Total Requisições</div>
              </div>
              <div className="bg-green-900/50 p-3 rounded-lg">
                <div className="text-2xl font-bold text-green-400">{usageStats.totalSuccess}</div>
                <div className="text-xs text-green-400 uppercase">Sucessos</div>
              </div>
              <div className="bg-red-900/50 p-3 rounded-lg">
                <div className="text-2xl font-bold text-red-400">{usageStats.totalErrors}</div>
                <div className="text-xs text-red-400 uppercase">Erros</div>
              </div>
            </div>

            <h4 className="text-xs font-semibold text-gray-400 mb-3 uppercase">Ações Executadas</h4>
            <div className="space-y-2 font-mono text-xs">
              {usageStats.actionStats.length === 0 && (
                <p className="p-2 text-gray-500">Nenhuma ação registrada ainda.</p>
              )}
              {usageStats.actionStats.map((stat) => (
                <div key={stat.actionId} className="p-3 bg-gray-700/50 rounded flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{stat.icon}</span>
                    <div>
                      <div className="text-white font-semibold">{stat.actionName}</div>
                      <div className="text-gray-400 text-xs">
                        {stat.lastExecuted
                          ? `Última: ${new Date(stat.lastExecuted).toLocaleTimeString()}`
                          : "Nunca executado"}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-white font-bold text-lg">{stat.count}</div>
                    <div className="text-gray-400 text-xs">
                      <span className="text-green-400">✓ {stat.successCount}</span>
                      {stat.errorCount > 0 && <span className="text-red-400 ml-2">✗ {stat.errorCount}</span>}
                    </div>
                    <div className="text-gray-500 text-xs mt-1">avg: {stat.avgDuration}ms</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        {activeTab === "performance" && (
          <div className="p-2 text-gray-400">
            <h3 className="text-sm font-semibold text-white mb-2 font-sans uppercase">Top 5 Endpoints Lentos (P95)</h3>
            <div className="space-y-2 font-mono text-xs">
              {slowRequests.length === 0 && <p className="p-2">Nenhuma requisição lenta registrada.</p>}
              {slowRequests.map((req) => (
                <div key={req.id} className="p-2 bg-gray-700/50 rounded flex justify-between items-center">
                  <span className="text-white truncate w-1/2">{req.label}</span>
                  <span className="text-yellow-400 font-bold">{req.duration}ms</span>
                </div>
              ))}
            </div>
          </div>
        )}
        {activeTab === "errors" && (
          <div className="p-2 text-gray-400">
            <div className="space-y-2 font-mono text-xs">
              {sortedErrors.length === 0 && <p className="p-2">Nenhum erro agrupado.</p>}
              {sortedErrors.map(([errorType, data]) => (
                <div key={errorType} className="p-2 bg-red-900/50 rounded">
                  <div className="flex justify-between items-center">
                    <span className="text-red-300 font-bold">{errorType}</span>
                    <span className="text-white bg-red-600/50 px-2 py-0.5 rounded-full">{data.count} Ocorrências</span>
                  </div>
                  <div className="text-gray-400 mt-1">Última em: {data.lastTimestamp.toLocaleTimeString()}</div>
                </div>
              ))}
            </div>
          </div>
        )}
        {activeTab === "cache" && (
          <div className="p-4 text-gray-400">
            <h3 className="text-sm font-semibold text-white mb-3 font-sans uppercase">Estatísticas de Cache</h3>
            <div className="grid grid-cols-3 gap-4 font-mono text-center">
              <div className="bg-gray-700/50 p-3 rounded-lg">
                <div className="text-2xl font-bold text-white">{observabilityData.cacheStats.hits + observabilityData.cacheStats.misses}</div>
                <div className="text-xs text-gray-400 uppercase">Total</div>
              </div>
              <div className="bg-green-900/50 p-3 rounded-lg">
                <div className="text-2xl font-bold text-green-400">{observabilityData.cacheStats.hits}</div>
                <div className="text-xs text-green-400 uppercase">Hits</div>
              </div>
              <div className="bg-yellow-900/50 p-3 rounded-lg">
                <div className="text-2xl font-bold text-yellow-400">{observabilityData.cacheStats.misses}</div>
                <div className="text-xs text-yellow-400 uppercase">Misses</div>
              </div>
            </div>
            <div className="mt-4 text-center">
              <span className="text-3xl font-bold text-green-400">
                {observabilityData.cacheStats.hits + observabilityData.cacheStats.misses > 0
                  ? ((observabilityData.cacheStats.hits / (observabilityData.cacheStats.hits + observabilityData.cacheStats.misses)) * 100).toFixed(0)
                  : 0}
                %
              </span>
              <span className="text-gray-400 ml-2">Hit Rate</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Componente Principal
export default function TestDashboardPage() {
  const config = loadStoredConfig();
  const [filters, setFilters] = useState<TestFilters>(config.filters);
  const { globalMetrics, requests, logs, observabilityData } = useObservability(filters);
  const [selectedRequest, setSelectedRequest] = useState<RequestData | null>(null);
  const [isRunningStressTest, setIsRunningStressTest] = useState(false);

  useEffect(() => {
    // Verificar se logging está habilitado
    if (!isLoggingEnabled()) {
      console.warn(
        "[Test Dashboard] ⚠️ Logging desabilitado. " +
        "Para habilitar em desenvolvimento: localStorage.setItem('insights_test_logging_enabled', 'true')"
      );
      return;
    }

    // Interceptar requisições e console apenas se habilitado
    interceptRequests();
    interceptConsole();

    return () => {
      restoreRequests();
      restoreConsole();
    };
  }, []);

  const stages = [
    requests.filter((r) => r.stage === 0),
    requests.filter((r) => r.stage === 1 || r.stage === 2),
    requests.filter((r) => r.stage === 3),
    requests.filter((r) => r.stage === 4),
    requests.filter((r) => r.stage === 5),
    requests.filter((r) => r.stage === 6),
  ];

  const stageDefs = [
    { title: "Input", icon: <ChevronRight className="w-5 h-5 text-gray-500" /> },
    { title: "Validation", icon: <CheckCircle className="w-5 h-5 text-blue-500" /> },
    { title: "Request Engine", icon: <Zap className="w-5 h-5 text-yellow-500" /> },
    { title: "Normalization", icon: <Settings className="w-5 h-5 text-indigo-500" /> },
    { title: "Storage", icon: <Archive className="w-5 h-5 text-purple-500" /> },
    { title: "Output", icon: <ArrowRight className="w-5 h-5 text-green-500" /> },
  ];

  const handleStressTest = async () => {
    setIsRunningStressTest(true);
    try {
      await runStressTest(config.stressTestConfig, (progress) => {
        console.log("Stress test progress:", progress);
      });
    } finally {
      setIsRunningStressTest(false);
    }
  };

  const handleSimulateVisit = async () => {
    setIsRunningStressTest(true);
    try {
      const result = await simulateFullVisit();
      console.log("✅ Simulação completa:", result);
      alert(
        `Simulação concluída!\n\n` +
        `Duração total: ${(result.duration / 1000).toFixed(2)}s\n` +
        `Passos executados: ${result.steps.length}\n` +
        `Sucesso: ${result.success ? "✅" : "❌"}\n\n` +
        `Detalhes:\n${result.steps.map((s, i) => `${i + 1}. ${s.name}: ${s.success ? "✅" : "❌"} (${s.duration.toFixed(0)}ms)`).join("\n")}`
      );
    } catch (error) {
      console.error("❌ Erro na simulação:", error);
      alert(`Erro na simulação: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setIsRunningStressTest(false);
    }
  };

  const handleClearData = () => {
    clearMetrics();
    clearLogs();
    window.location.reload();
  };

  useEffect(() => {
    // Aplicar estilos globais apenas no cliente
    const style = document.createElement("style");
    style.textContent = `
      body {
        background-color: #030712;
      }
      ::-webkit-scrollbar {
        width: 8px;
        height: 8px;
      }
      ::-webkit-scrollbar-track {
        background: #111827;
      }
      ::-webkit-scrollbar-thumb {
        background: #4b5563;
        border-radius: 4px;
      }
      ::-webkit-scrollbar-thumb:hover {
        background: #6b7280;
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  const loggingEnabled = isLoggingEnabled();
  const isDevelopment = process.env.NODE_ENV === "development";

  // Bloquear acesso em produção
  if (!isDevelopment) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-950 text-white">
        <div className="text-center p-8">
          <h1 className="text-2xl font-bold mb-4">🚫 Acesso Restrito</h1>
          <p className="text-gray-400">
            Este dashboard de testes está disponível apenas em ambiente de desenvolvimento.
          </p>
          <p className="text-sm text-gray-500 mt-2">
            NODE_ENV: {process.env.NODE_ENV}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-950 text-white font-sans overflow-hidden">
      {loggingEnabled && <SecurityWarning />}

      <Header metrics={globalMetrics} filters={filters} setFilters={setFilters} />

      <main className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 flex overflow-x-auto">
          {stageDefs.map((stage, index) => (
            <StageColumn key={`stage-${index}-${stage.title}`} title={stage.title} icon={stage.icon} count={stages[index]?.length || 0}>
              <AnimatePresence mode="popLayout">
                {(stages[index] || []).map((req) => (
                  <RequestDot key={`req-${req.id}-${req.traceId}`} request={req} onClick={() => setSelectedRequest(req)} />
                ))}
              </AnimatePresence>
            </StageColumn>
          ))}
        </div>

        <TabbedPanel logs={logs} observabilityData={observabilityData} />
      </main>

      <div className="absolute bottom-4 right-4 flex gap-2">
        <button
          onClick={handleStressTest}
          disabled={isRunningStressTest}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {isRunningStressTest ? "Running..." : "Stress Test"}
        </button>
        <button
          onClick={handleSimulateVisit}
          disabled={isRunningStressTest}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
        >
          {isRunningStressTest ? "Running..." : "Simulate Visit"}
        </button>
        <button onClick={handleClearData} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
          Clear Data
        </button>
      </div>

      <AnimatePresence>
        {selectedRequest && (
          <RequestDetailModal request={selectedRequest} onClose={() => setSelectedRequest(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}

