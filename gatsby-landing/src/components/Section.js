import React from "react";
import Form from "./Form"; // Importar o novo componente de formulário

const CtaButton = ({ color, link, label }) => {
  const baseClasses =
    "inline-block px-8 py-3 font-semibold rounded-lg transition-colors duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-1";
  const colorClasses = {
    cta: "bg-blue-600 text-white hover:bg-blue-700",
    contrast: "bg-white text-blue-600 border border-gray-300 hover:bg-gray-100",
  };
  return (
    <a
      href={link}
      className={`${baseClasses} ${colorClasses[color] || colorClasses.cta}`}
    >
      {label}
    </a>
  );
};

const elementMap = {
  preHeading: ({ text }) => (
    <span className="text-sm font-bold uppercase tracking-wider text-blue-600">
      {text}
    </span>
  ),
  heading: ({ text }) => (
    <h2 className="text-3xl md:text-4xl font-bold text-gray-900 leading-tight">
      {text}
    </h2>
  ),
  subHeading: ({ text }) => (
    <h3 className="text-xl md:text-2xl font-semibold text-gray-700">{text}</h3>
  ),
  paragraph: ({ text }) => (
    <p
      className="text-lg text-gray-600 leading-relaxed"
      dangerouslySetInnerHTML={{ __html: text }}
    />
  ),
  image: ({ src, alt }) => (
    <img src={src} alt={alt || ""} className="rounded-lg shadow-xl w-full" />
  ),
  custom: ({ component: Component }) => <Component />,
  ctaButton: ({ buttons, alignment = "center" }) => (
    <div className={`flex flex-wrap gap-4 pt-4 justify-${alignment}`}>
      {buttons &&
        buttons.map((button, index) => <CtaButton key={index} {...button} />)}
    </div>
  ),
  form: (props) => <Form {...props} />,
};

const renderContent = (content, alignment) => {
  return content.map((item, index) => {
    if (item.type === "ctaButton") {
      item.alignment = alignment;
    }
    const Element = elementMap[item.type];
    if (item.type === "custom") {
      return <Element key={index} {...item} />;
    }
    return Element ? <Element key={index} {...item} /> : null;
  });
};

const Section = ({ settings = {}, content = [] }) => {
  if (!content || content.length === 0) return null;

  const {
    layout = "boxed",
    backgroundColor,
    textAlignment = "center",
    imageSide = "left",
    sectionId,
  } = settings;

  const sortedContent = [...content].sort(
    (a, b) => (a.order || 0) - (b.order || 0)
  );

  const sectionStyle = {
    backgroundColor: backgroundColor || undefined,
  };

  if (layout === "boxed") {
    return (
      <section id={sectionId} className="py-16 md:py-24" style={sectionStyle}>
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`max-w-4xl mx-auto text-${textAlignment} space-y-6`}>
            {renderContent(sortedContent, textAlignment)}
          </div>
        </div>
      </section>
    );
  }

  if (layout === "two-columns") {
    const imageContent = sortedContent.find((item) => item.type === "image");
    const textContent = sortedContent.filter((item) => item.type !== "image");
    const preHeadingItem = textContent.find(
      (item) => item.type === "preHeading"
    );

    // HACK DEFINITIVO: Usa o texto do subtítulo como gatilho.
    if (
      preHeadingItem?.text === "FULL WIDTH BACKGROUND IMAGE" &&
      imageContent
    ) {
      const imageColumnStyle = {
        backgroundImage: `url(${imageContent.src})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        minHeight: "400px",
      };

      return (
        <section id={sectionId} className="w-full" style={sectionStyle}>
          <div className="grid grid-cols-1 md:grid-cols-2">
            <div
              className={`py-16 md:py-24 px-4 sm:px-6 lg:px-8 flex items-center justify-center ${
                imageSide === "left" ? "md:order-last" : ""
              }`}
            >
              <div className={`space-y-6 text-${textAlignment} max-w-md`}>
                {renderContent(textContent, textAlignment)}
              </div>
            </div>
            <div
              className="bg-cover bg-center"
              style={imageColumnStyle}
              aria-label={imageContent.alt || ""}
            ></div>
          </div>
        </section>
      );
    }

    // Layout padrão de duas colunas
    return (
      <section id={sectionId} className="py-16 md:py-24" style={sectionStyle}>
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div
              className={`space-y-6 text-${textAlignment} ${
                imageSide === "right" ? "md:order-last" : ""
              }`}
            >
              {renderContent(textContent, textAlignment)}
            </div>
            <div className="flex items-center justify-center">
              {imageContent && <elementMap.image {...imageContent} />}
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (layout === "two-columns-bg-image") {
    const imageContent = sortedContent.find((item) => item.type === "image");
    const textContent = sortedContent.filter((item) => item.type !== "image");

    if (!imageContent) {
      // Se não há imagem, volta para o layout padrão
      return (
        <section id={sectionId} className="py-16 md:py-24" style={sectionStyle}>
          <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div
              className={`max-w-4xl mx-auto text-${textAlignment} space-y-6`}
            >
              {renderContent(textContent, textAlignment)}
            </div>
          </div>
        </section>
      );
    }

    const imageColumnStyle = {
      backgroundImage: `url(${imageContent.src})`,
      backgroundSize: "cover",
      backgroundPosition: "center",
      backgroundRepeat: "no-repeat",
    };

    return (
      <section id={sectionId} className="w-full" style={sectionStyle}>
        <div className="grid grid-cols-1 md:grid-cols-2 min-h-[500px]">
          {imageSide === "left" ? (
            <>
              {/* Coluna de Imagem à Esquerda */}
              <div
                className="bg-cover bg-center bg-no-repeat"
                style={imageColumnStyle}
                aria-label={imageContent?.alt || ""}
              />
              {/* Coluna de Texto à Direita */}
              <div className="flex items-center justify-center p-8 md:p-16">
                <div className={`space-y-6 text-${textAlignment} max-w-md`}>
                  {renderContent(textContent, textAlignment)}
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Coluna de Texto à Esquerda */}
              <div className="flex items-center justify-center p-8 md:p-16">
                <div className={`space-y-6 text-${textAlignment} max-w-md`}>
                  {renderContent(textContent, textAlignment)}
                </div>
              </div>
              {/* Coluna de Imagem à Direita */}
              <div
                className="bg-cover bg-center bg-no-repeat"
                style={imageColumnStyle}
                aria-label={imageContent?.alt || ""}
              />
            </>
          )}
        </div>
      </section>
    );
  }

  return null;
};

export default Section;
