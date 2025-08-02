import React from "react";
import { buildCloudinaryUrl } from "../lib/cloudinary"; // Importar a função
// import JotformEmbed from "react-jotform-embed";

const Hero = ({
  background = {},
  heading = {},
  subHeading = {},
  textSlider = {},
  form = {},
  textPosition, // Prop para controlar o layout
}) => {
  // Data setup - Suporte para estruturas antigas e novas
  const backgroundData = background?.data || background || {};
  const headingData = heading?.data || heading || {};
  const subHeadingData = subHeading?.data || subHeading || {};
  const textSliderData = textSlider?.data || textSlider || {};
  const formData = form?.data || form || {};

  if (!headingData?.text && !subHeadingData?.text && !textSliderData?.heading) {
    return null;
  }

  const HeadingTag = `h${headingData?.level || 1}`;

  // Define o public ID da imagem, lidando com ambas as estruturas de dados.
  const imagePublicId =
    typeof backgroundData === "string" ? backgroundData : backgroundData?.image;

  // Construir a URL da imagem de fundo otimizada
  const backgroundImageUrl = buildCloudinaryUrl(imagePublicId, {
    width: 1920,
    quality: "auto",
    format: "auto",
  });

  // Style logic...
  const hasSolidBg = !!backgroundData?.color;
  const hasImageBg = !!backgroundImageUrl; // Usar a URL construída
  const backgroundClass =
    backgroundData.color ||
    "bg-gradient-to-br from-blue-700 via-purple-700 to-blue-900";
  const mainTextColor = hasSolidBg ? "text-gray-900" : "text-white";
  const subTextColor = hasSolidBg ? "text-gray-600" : "text-blue-100";
  const showOverlay = hasImageBg && !hasSolidBg;
  const isCenterLayout = textPosition === "center";

  const renderForm = () => {
    if (!formData || !formData.formType) return null;

    // Adiciona verificação para garantir que formData.formData existe
    if (!formData.formData) {
      console.warn(
        "Hero Component: 'form.formData' is missing for form placeholder."
      );
      return null;
    }

    return (
      <div
        id={formData.id}
        className="bg-white rounded-xl shadow-2xl p-8 animate-fade-in w-full"
      >
        <div className="flex flex-col space-y-5">
          {formData.heading && (
            <h3 className="text-2xl font-bold text-gray-900">
              {formData.heading}
            </h3>
          )}
          {formData.subheading && (
            <p className="text-gray-600 text-base leading-relaxed mb-0">
              {formData.subheading}
            </p>
          )}
          {/* <JotformEmbed src="https://form.jotformeu.com/210911653803450" /> */}
        </div>
      </div>
    );
  };

  const textContent = (
    <>
      {headingData?.text && (
        <HeadingTag
          className={`text-2xl md:text-4xl font-extrabold ${mainTextColor} leading-tight tracking-tight`}
          style={isCenterLayout ? { textAlign: "center" } : {}}
        >
          {headingData.text}
        </HeadingTag>
      )}
      {subHeadingData?.text && (
        <p
          className={`text-lg md:text-xl ${subTextColor} leading-relaxed max-w-2xl mx-auto`}
          style={isCenterLayout ? { textAlign: "center" } : {}}
        >
          {subHeadingData.text}
        </p>
      )}
      {textSliderData?.heading && (
        <div
          className="pt-5 space-y-5"
          style={isCenterLayout ? { textAlign: "center" } : {}}
        >
          {/* ... conteúdo do slider ... */}
          <h3 className={`text-xl md:text-2xl font-semibold ${mainTextColor}`}>
            {textSliderData.heading}
          </h3>
          {textSliderData?.content && (
            <div
              className={`${subTextColor} leading-relaxed prose prose-invert`}
              dangerouslySetInnerHTML={{ __html: textSliderData.content }}
            />
          )}
          {textSliderData?.button && (
            <div className="pt-3">
              <a
                href={textSliderData.button?.link}
                className={`inline-flex items-center px-8 py-4 border-2 ${
                  hasSolidBg
                    ? "border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white"
                    : "border-white text-white hover:bg-white hover:text-blue-600"
                } font-bold rounded-lg text-base shadow-lg`}
              >
                {textSliderData.button?.label}
              </a>
            </div>
          )}
        </div>
      )}
    </>
  );
  return (
    <section
      className={`relative flex min-h-[80vh] items-center justify-center py-10 ${backgroundClass}`}
      style={{
        backgroundImage: backgroundImageUrl
          ? `url(${backgroundImageUrl})`
          : undefined,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {showOverlay && <div className="absolute inset-0 bg-black/50"></div>}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div
          className="grid lg:grid-cols-2 gap-12 items-center teste"
          style={
            isCenterLayout
              ? {
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  rowGap: "2rem",
                  maxWidth: "920px",
                  margin: "0 auto",
                }
              : {}
          }
        >
          <div
            className={
              isCenterLayout ? "w-full" : "text-center lg:text-left space-y-6"
            }
          >
            {textContent}
          </div>
          <div
            className={`flex ${
              isCenterLayout
                ? "justify-center"
                : "justify-center lg:justify-end"
            } w-full`}
          >
            {renderForm()}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
