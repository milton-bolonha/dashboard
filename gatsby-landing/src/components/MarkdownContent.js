import React from "react";

const MarkdownContent = ({ html, className }) => {
  // Adiciona a classe 'inner-content' para manter a compatibilidade com estilos existentes
  const fullClassName = `prose max-w-none inner-content ${
    className || ""
  }`.trim();

  return (
    <div className={fullClassName} dangerouslySetInnerHTML={{ __html: html }} />
  );
};

export default MarkdownContent;
