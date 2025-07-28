import React from "react";
import TopBar from "../components/TopBar";

const TopBarContainer = (props) => {
  // Se não houver dados, não renderiza nada.
  if (!props || Object.keys(props).length === 0) {
    return null;
  }

  // A prop 'props' aqui é o objeto 'topbarData' que já tem a estrutura correta.
  // Simplesmente passamos todos os dados para o componente TopBar.
  return <TopBar {...props} />;
};

export default TopBarContainer;
