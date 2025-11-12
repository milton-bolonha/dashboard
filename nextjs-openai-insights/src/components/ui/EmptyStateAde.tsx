import { Loader2 } from "lucide-react";

interface EmptyStateAdeProps {
  title: string;
  description: string;
  isLoading?: boolean;
}

export function EmptyStateAde({ title, description, isLoading = false }: EmptyStateAdeProps) {
  return (
    <div className="flex min-h-[220px] flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-gray-300 bg-white p-8 text-center">
      {isLoading && (
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      )}
      <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      <p className="max-w-md text-sm text-gray-600">{description}</p>
    </div>
  );
}

