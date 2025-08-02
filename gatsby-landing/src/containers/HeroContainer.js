import React from "react";
import Hero from "../components/Hero";

/**
 * HeroContainer agora atua como um simples "pass-through" de props,
 * passando todos os dados recebidos diretamente para o componente Hero.
 * Isso simplifica a lógica e se adapta à estrutura de dados da API.
 */
const HeroContainer = (props) => {
  // Se não houver props, não renderiza nada.
  if (!props || Object.keys(props).length === 0) {
    return null;
  }

  // Passa todas as props diretamente para o componente Hero.
  return <Hero {...props} />;
};

export default HeroContainer;
