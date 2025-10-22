import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

export function Tile({ title, excerpt, className }) {
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
      <div className="bg-white p-4 border-b-[0.41px] border-[#0000001A]">
        <h3 className="font-semibold text-[16px] text-[#111] truncate">
          {title}
        </h3>
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
