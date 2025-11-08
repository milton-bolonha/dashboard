interface EmptyStateDashProps {
  title: string;
  description: string;
}

export function EmptyStateDash({ title, description }: EmptyStateDashProps) {
  return (
    <div className="flex min-h-[200px] flex-col justify-center gap-2 rounded-xl border border-dashed border-[#d9d9de] bg-white px-6 py-8 text-center text-[#3a3a41]">
      <h3 className="text-lg font-semibold text-[#1f2024]">{title}</h3>
      <p className="text-sm text-[#5a5b60]">{description}</p>
    </div>
  );
}

