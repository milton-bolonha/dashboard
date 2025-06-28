const translations = {
  pt: {
    // Navigation
    dashboard: "Dashboard",
    sections: "Sections",
    contentTypes: "Content Types",
    users: "Usuários",
    billing: "Cobrança",
    settings: "Configurações",

    // Common
    save: "Salvar",
    cancel: "Cancelar",
    edit: "Editar",
    delete: "Excluir",
    create: "Criar",
    add: "Adicionar",
    loading: "Carregando...",

    // Sections
    createSection: "Criar Section",
    editSection: "Editar Section",
    sectionName: "Nome da Section",
    sectionSlug: "Slug da Section",
    sectionDescription: "Descrição",
    sectionIcon: "Ícone da Section",
    sectionStatus: "Status",
    active: "Ativo",
    inactive: "Inativo",

    // Content Types
    createContentType: "Criar Content Type",
    editContentType: "Editar Content Type",
    contentTypeName: "Nome do Content Type",

    // Settings
    database: "Base de Dados",
    backup: "Backup",
    apiKeys: "Chaves API",
    dangerZone: "Zona de Perigo",
    cleanDatabase: "Limpar Base de Dados",
    exportData: "Exportar Dados",
    generateApiKey: "Gerar Chave API",
    resetDashboard: "Resetar Dashboard",
  },

  en: {
    // Navigation
    dashboard: "Dashboard",
    sections: "Sections",
    contentTypes: "Content Types",
    users: "Users",
    billing: "Billing",
    settings: "Settings",

    // Common
    save: "Save",
    cancel: "Cancel",
    edit: "Edit",
    delete: "Delete",
    create: "Create",
    add: "Add",
    loading: "Loading...",

    // Sections
    createSection: "Create Section",
    editSection: "Edit Section",
    sectionName: "Section Name",
    sectionSlug: "Section Slug",
    sectionDescription: "Description",
    sectionIcon: "Section Icon",
    sectionStatus: "Status",
    active: "Active",
    inactive: "Inactive",

    // Content Types
    createContentType: "Create Content Type",
    editContentType: "Edit Content Type",
    contentTypeName: "Content Type Name",

    // Settings
    database: "Database",
    backup: "Backup",
    apiKeys: "API Keys",
    dangerZone: "Danger Zone",
    cleanDatabase: "Clean Database",
    exportData: "Export Data",
    generateApiKey: "Generate API Key",
    resetDashboard: "Reset Dashboard",
  },
};

// Hook para usar traduções
export function useTranslations(locale = "pt") {
  const t = (key) => {
    return translations[locale]?.[key] || translations["en"]?.[key] || key;
  };

  return { t, locale };
}

// Função helper para componentes que não podem usar hooks
export function translate(key, locale = "pt") {
  return translations[locale]?.[key] || translations["en"]?.[key] || key;
}
