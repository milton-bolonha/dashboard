import { Loader2, Plus } from "lucide-react";

interface EmptyStateAdeProps {
  title: string;
  description: string;
  isLoading?: boolean;
  isGenerating?: boolean; // Novo: para diferenciar loading de geração
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyStateAde({ 
  title, 
  description, 
  isLoading = false, 
  isGenerating = false,
  action 
}: EmptyStateAdeProps) {
  // Se está gerando, sempre mostrar loading (não mostrar action)
  // Se está apenas carregando (reidratação), mostrar loading mas pode ter action
  // Se está vazio, não mostrar loading e mostrar action se disponível
  const showLoader = isLoading || isGenerating;
  const showAction = !isGenerating && action; // Não mostrar action quando está gerando
  
  return (
    <div className="flex min-h-[220px] flex-col items-center justify-center gap-4 rounded-3xl border border-dashed border-gray-300 bg-white p-8 text-center">
      {showLoader && (
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      )}
      <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      <p className="max-w-md text-sm text-gray-600">{description}</p>
      {showAction && (
        <button
          type="button"
          onClick={action.onClick}
          className="mt-2 inline-flex items-center gap-2 rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-800 cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          {action.label}
        </button>
      )}
    </div>
  );
}

