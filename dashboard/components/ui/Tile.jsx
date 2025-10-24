import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

export function Tile({ title, excerpt, className, onDelete }) {
  const createMarkup = (htmlString) => {
    // Sanitize HTML here if needed in a real app
    return { __html: htmlString };
  };

  // Processar excerpt: converter quebras de linha e formatação básica
  const processExcerpt = (text) => {
    if (!text) return text;

    // Converter listas básicas
    let processed = text
      .replace(/^\*\s+(.*)$/gm, "• $1") // Listas com * viram bullets
      .replace(/^\d+\.\s+(.*)$/gm, "$1") // Remover números de listas numeradas
      .replace(/(\*\*.*?\*\*)/g, "<strong>$1</strong>") // Negrito
      .replace(/\*(.*?)\*/g, "<em>$1</em>"); // Itálico

    // Converter quebras de linha em <br>
    processed = processed.replace(/\n/g, "<br/>");

    return processed;
  };

  return (
    <div
      className={`
        bg-[#FAFAFA] rounded-[16px]
        shadow-[0px_3.26px_16.32px_0px_#0000001A]
        border-[0.41px] border-[#0000001A]
        flex flex-col
        overflow-hidden
        ${inter.className} ${className || ""}
      `}
      style={{ height: "192px", width: "100%" }}
    >
      {/* Header Section */}
      <div className="bg-white p-4 border-b-[0.41px] border-[#0000001A] flex items-center justify-between">
        <h3 className="font-semibold text-[16px] text-[#111] truncate">
          {title}
        </h3>
        {onDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="p-1 rounded-full hover:bg-red-100 transition-colors opacity-0 group-hover:opacity-100"
            title="Delete tile"
          >
            <svg
              className="w-4 h-4 text-red-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
        )}
      </div>

      {/* Content Section */}
      <div className="p-4 flex-grow overflow-hidden">
        <div
          className="text-[15px] text-[#333] leading-relaxed"
          dangerouslySetInnerHTML={createMarkup(processExcerpt(excerpt))}
        />
      </div>
    </div>
  );
}
