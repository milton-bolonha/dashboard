interface EmptyStateAdeProps {
  title: string;
  description: string;
}

export function EmptyStateAde({ title, description }: EmptyStateAdeProps) {
  return (
    <div className="flex min-h-[220px] flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-gray-300 bg-white p-8 text-center">
      <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      <p className="max-w-md text-sm text-gray-600">{description}</p>
    </div>
  );
}

