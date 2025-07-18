import React from "react";
import TopBar from "../components/TopBar";

const TopBarContainer = (props) => {
  // Pega a prop de cor e remove das props que serão ordenadas
  const { bgColor, ...restProps } = props;

  // Fallback para props vazias
  if (!restProps || Object.keys(restProps).length === 0) {
    return null;
  }

  // Extrai e ordena os elementos baseado na prop order
  const elements = Object.entries(restProps)
    .filter(([key, value]) => value && typeof value === "object")
    .map(([key, value]) => ({
      key,
      ...value,
      order: value.order || 0,
    }))
    .sort((a, b) => a.order - b.order);

  // Se não há elementos válidos, não renderiza
  if (elements.length === 0) return null;

  // Reorganiza as props na ordem correta
  const orderedProps = {};
  elements.forEach((element) => {
    orderedProps[element.key] = {
      data: element.data,
      order: element.order,
    };
  });

  return <TopBar {...orderedProps} bgColor={bgColor} />;
};

export default TopBarContainer;
