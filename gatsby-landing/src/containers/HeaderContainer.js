import React from "react";
import Header from "../components/Header";

const HeaderContainer = (props) => {
  // Fallback para props vazias
  if (!props || Object.keys(props).length === 0) {
    return null;
  }

  const { columns, ...restProps } = props;

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
  const orderedProps = { columns };
  elements.forEach((element) => {
    orderedProps[element.key] = {
      data: element.data,
      position: element.position,
      order: element.order,
    };
  });

  return <Header {...orderedProps} />;
};

export default HeaderContainer;
