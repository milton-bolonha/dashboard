import React from "react";
import Header from "../components/Header.js";

const HeaderContainer = (props) => {
  // Se não houver dados, não renderiza nada.
  if (!props || Object.keys(props).length === 0) {
    return null;
  }

  // A prop 'props' aqui é o objeto 'headerData' que já tem a estrutura correta.
  // Simplesmente passamos todos os dados para o componente Header.
  return <Header {...props} />;
};

export default HeaderContainer;
