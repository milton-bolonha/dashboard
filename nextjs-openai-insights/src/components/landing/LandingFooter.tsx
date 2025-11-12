"use client";

interface LandingFooterProps {
  onHelpClick?: () => void;
}

export function LandingFooter({ onHelpClick }: LandingFooterProps) {
  return (
    <button
      type="button"
      onClick={onHelpClick}
      className="fixed bottom-8 right-8 z-50 flex h-12 w-12 items-center justify-center rounded-full border border-gray-200 bg-white text-lg font-semibold text-gray-600 shadow-lg transition-shadow hover:shadow-xl"
      aria-label="Ajuda"
    >
      ?
    </button>
  );
}
