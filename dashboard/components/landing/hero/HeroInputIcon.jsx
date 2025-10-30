import { ArrowRight, ArrowUp, Check } from "lucide-react";

export default function HeroInputIcon({
  state,
  isEnabled,
  isLastInput,
  allInputsValid,
  styleMode,
  creating,
  onSubmit,
}) {
  // Modo transparente
  if (styleMode === "transparent") {
    // Último input + tudo válido: botão verde com bounce
    if (isLastInput && state.isValid && allInputsValid) {
      return (
        <button
          type="button"
          onClick={onSubmit}
          disabled={creating}
          className="w-8 h-8 bg-green-500 hover:bg-green-600 rounded-full flex items-center justify-center cursor-pointer disabled:opacity-60"
          style={{
            animation: creating
              ? "none"
              : "bouncePulse 4s ease-in-out infinite",
          }}
        >
          {creating ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
          ) : (
            <ArrowRight className="w-4 h-4 text-white" />
          )}
        </button>
      );
    }

    // Não é último + válido + não focado: esconder (lápis inline)
    if (!isLastInput && state.isValid && !state.focused && !creating) {
      return null;
    }

    // Input habilitado: seta azul
    if (isEnabled) {
      return (
        <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
          <ArrowUp className="w-4 h-4 text-white" />
        </div>
      );
    }

    // Desabilitado: cinza
    return (
      <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
        <div className="w-2 h-2 bg-white rounded-full" />
      </div>
    );
  }

  // Modo default
  if (!isEnabled) {
    return (
      <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
        <div className="w-2 h-2 bg-white rounded-full" />
      </div>
    );
  }

  if (state.isValid && !isLastInput) {
    return (
      <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
        <Check className="w-4 h-4 text-white" />
      </div>
    );
  }

  if (state.isValid && isLastInput && allInputsValid) {
    return (
      <button
        type="button"
        onClick={onSubmit}
        disabled={creating}
        className="w-8 h-8 bg-green-500 hover:bg-green-600 rounded-full flex items-center justify-center cursor-pointer"
        style={{
          animation: creating ? "none" : "bouncePulse 4s ease-in-out infinite",
        }}
      >
        {creating ? (
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
        ) : (
          <ArrowRight className="w-4 h-4 text-white" />
        )}
      </button>
    );
  }

  if (state.focused || state.hasContent) {
    return (
      <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
        <div className="w-2 h-2 bg-white rounded-full" />
      </div>
    );
  }

  return (
    <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
      <div className="w-2 h-2 bg-white rounded-full" />
    </div>
  );
}
