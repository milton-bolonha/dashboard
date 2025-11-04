import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import { useState, useEffect, useCallback } from "react";
import { ChevronDown, Plus, Save, Copy, Settings } from "lucide-react";
import { LoadingSpinner } from "../ui/LoadingSpinner";
import { ThemeToggle } from "../ui/ThemeToggle";

export function Header({
  title,
  workspaceName,
  isLoading,
  onCustomizeBackground,
  onSaveTemplate,
  onCloneDashboard,
  onCreateBlank,
  disableGuestApis,
}) {
  const { isSignedIn } = useUser();
  const [templates, setTemplates] = useState([]);
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [showDashboardSelector, setShowDashboardSelector] = useState(false);
  const [isTemplatesLoading, setIsTemplatesLoading] = useState(false);

  const loadTemplates = useCallback(async () => {
    setIsTemplatesLoading(true);
    try {
      // ⭐ NOVO: Pegar guest_id da URL se disponível (fluxo job_id)
      const params = new URLSearchParams(
        typeof window !== "undefined" ? window.location.search : ""
      );
      const guestId = params.get("guest_id");
      const url = guestId
        ? `/api/guest/templates?guest_id=${guestId}`
        : "/api/guest/templates";

      const response = await fetch(url);
      const data = await response.json();
      setTemplates(data.templates || []);
    } catch (error) {
      console.error("❌ Erro ao carregar templates:", error);
    } finally {
      setIsTemplatesLoading(false);
    }
  }, []);

  useEffect(() => {
    if (disableGuestApis) return;
    loadTemplates();
  }, [disableGuestApis, loadTemplates]);

  const handleTemplateSelect = (template) => {
    console.log("📋 Template selecionado:", template);
    setShowTemplateSelector(false);
    // TODO: Aplicar template
  };

  return (
    <header className="flex-shrink-0" style={{ height: "72px" }}>
      <div className="flex items-center justify-between h-full px-6">
        <div>
          {isLoading ? (
            <LoadingSpinner text="Loading..." />
          ) : (
            <h1 className="text-2xl font-semibold text-gray-800 dark:text-gray-100">
              {workspaceName || "Trial Workspace"}
            </h1>
          )}
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {title}
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            {/* Dark Mode Toggle */}
            <ThemeToggle />

            {onCustomizeBackground && (
              <button
                onClick={onCustomizeBackground}
                className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 transition-colors"
                title="Customize Background"
              >
                <Settings className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              </button>
            )}

            {/* Dashboards Dropdown Restaurado */}
            <div className="relative">
              <button
                onClick={() => setShowDashboardSelector(!showDashboardSelector)}
                className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <span>Dashboards</span>
                <ChevronDown className="w-4 h-4" />
              </button>
              {showDashboardSelector && (
                <div className="absolute top-full right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
                  <div className="p-4">
                    <div className="space-y-2">
                      <button
                        onClick={() => {
                          onCreateBlank?.();
                          setShowDashboardSelector(false);
                        }}
                        className="w-full text-left p-3 hover:bg-gray-50 rounded-lg border border-gray-100 transition-colors group"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium text-gray-900">
                              Create Blank Dashboard
                            </div>
                            <div className="text-sm text-gray-500">
                              Start with an empty dashboard
                            </div>
                          </div>
                          <Plus className="w-4 h-4 text-gray-400" />
                        </div>
                      </button>
                      <div className="border-t border-gray-200 my-2"></div>
                      <div className="text-xs text-gray-500 mb-2">
                        Available Dashboards:
                      </div>
                      <div className="text-sm text-gray-400 italic">
                        No saved dashboards yet
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Templates Dropdown Restaurado */}
            <div className="relative">
              <button
                onClick={() => setShowTemplateSelector(!showTemplateSelector)}
                className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <span>Templates</span>
                <ChevronDown className="w-4 h-4" />
              </button>
              {showTemplateSelector && (
                <div className="absolute top-full right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
                  <div className="p-4">
                    <div className="space-y-2">
                      {isTemplatesLoading ? (
                        <p className="text-center text-gray-500">Loading...</p>
                      ) : (
                        templates
                          .filter((t) => t.isDefault)
                          .map((template) => (
                            <button
                              key={template.id}
                              onClick={() => handleTemplateSelect(template)}
                              className="w-full text-left p-3 hover:bg-gray-50 rounded-lg border border-gray-100 transition-colors group"
                              title={`${template.tiles?.length || 0} tiles`}
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <div className="font-medium text-gray-900">
                                    {template.name}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    {template.description}
                                  </div>
                                </div>
                                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                              </div>
                            </button>
                          ))
                      )}
                      <div className="border-t border-gray-200 my-2"></div>
                      <button
                        onClick={() => {
                          onSaveTemplate?.();
                          setShowTemplateSelector(false);
                        }}
                        className="w-full text-left p-3 hover:bg-gray-50 rounded-lg border border-gray-100 transition-colors group"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium text-gray-900">
                              Save as Template
                            </div>
                            <div className="text-sm text-gray-500">
                              Save current dashboard
                            </div>
                          </div>
                          <Save className="w-4 h-4 text-gray-400" />
                        </div>
                      </button>
                      <button
                        onClick={() => {
                          onCloneDashboard?.();
                          setShowTemplateSelector(false);
                        }}
                        className="w-full text-left p-3 hover:bg-gray-50 rounded-lg border border-gray-100 transition-colors group"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium text-gray-900">
                              Clone Dashboard
                            </div>
                            <div className="text-sm text-gray-500">
                              Duplicate current dashboard
                            </div>
                          </div>
                          <Copy className="w-4 h-4 text-gray-400" />
                        </div>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          {!isSignedIn && (
            <>
              <Link
                href="/sign-in"
                className="text-sm font-semibold bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors"
              >
                Log in
              </Link>
              <Link
                href="/sign-up"
                className="text-sm font-semibold border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
