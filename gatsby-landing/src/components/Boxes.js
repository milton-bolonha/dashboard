import React from "react";
import {
  Squares2X2Icon,
  BuildingOfficeIcon,
  HomeIcon,
  SunIcon,
} from "@heroicons/react/24/outline";

const iconMap = {
  building: Squares2X2Icon,
  industrial: BuildingOfficeIcon,
  home: HomeIcon,
  landscaping: SunIcon,
};

const Boxes = ({ title, subtitle, boxes = [], isAlternate = false }) => {
  if (!boxes || boxes.length === 0) {
    return null;
  }

  const renderBox = (box, index) => {
    // Simplificamos a desestruturação para pegar os dados diretamente do objeto 'box'.
    // Usamos "title" e "text" como definido no nosso page_builder.
    const { title, text, icon } = box;
    const IconComponent = icon ? iconMap[icon] : null;

    return (
      <div
        key={index}
        className="bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 flex flex-col p-8 text-center items-center space-y-4"
      >
        {IconComponent && (
          <div className="bg-blue-100 rounded-full p-4 flex items-center justify-center">
            <IconComponent className="h-10 w-10 text-blue-600" />
          </div>
        )}
        <h2 className="text-xl font-bold text-gray-800 leading-tight">
          {title}
        </h2>
        <p className="text-gray-600 leading-relaxed text-base flex-grow">
          {text}
        </p>
      </div>
    );
  };

  // A ordenação pode ser removida se não for mais necessária, ou mantida se o frontmatter tiver 'order'.
  const orderedBoxes = [...boxes].sort(
    (a, b) => (a.order || 0) - (b.order || 0)
  );

  // Lógica para ajustar dinamicamente o número de colunas da grade
  const gridCols = {
    1: "lg:grid-cols-1",
    2: "lg:grid-cols-2",
    3: "lg:grid-cols-3",
    4: "lg:grid-cols-4",
  };

  const numBoxes = orderedBoxes.length;
  // Usa a contagem de caixas para a classe, mas limita a 4 colunas no máximo.
  const lgGridClass = gridCols[numBoxes] || gridCols[4];

  // Define a classe de fundo com base na prop isAlternate
  const backgroundClass = isAlternate ? "bg-gray-50" : "bg-white";

  return (
    <section className={`py-16 md:py-24 ${backgroundClass}`}>
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-4xl mx-auto space-y-2 mb-12">
          <h2 className="text-3xl font-bold text-gray-900 leading-tight">
            {title}
          </h2>
          {subtitle && (
            <p className="text-lg font-medium text-blue-600 uppercase tracking-wider">
              {subtitle}
            </p>
          )}
        </div>
        <div
          className={`grid grid-cols-1 md:grid-cols-2 ${lgGridClass} gap-8 mt-12`}
        >
          {orderedBoxes.map((box, index) => renderBox(box, index))}
        </div>
      </div>
    </section>
  );
};

export default Boxes;
