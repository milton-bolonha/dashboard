import React from "react";
import Hero from "../components/Hero";

const HeroBuilderContainer = ({ hero }) => {
  if (!hero) {
    return null;
  }

  // Correção: Separa o textPosition (que é um valor simples)
  // do resto das props, que são objetos.
  const { textPosition, ...restOfHero } = hero;

  // Passa o textPosition diretamente
  const adaptedProps = { textPosition };

  // Adapta o restante das props para o formato { data: ... } esperado pelo componente Hero
  for (const key in restOfHero) {
    if (Object.hasOwnProperty.call(restOfHero, key)) {
      adaptedProps[key] = { data: restOfHero[key] };
    }
  }

  return <Hero {...adaptedProps} />;
};

export default HeroBuilderContainer;
