import React from "react";
import Hero from "../components/Hero";

const HeroContainer = (props) => {
  // Fallback para props vazias
  if (!props || Object.keys(props).length === 0) {
    return null;
  }

  // Extrai e ordena os elementos baseado na prop order
  const elements = Object.entries(props)
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

  return <Hero {...orderedProps} />;
};

export default HeroContainer;
