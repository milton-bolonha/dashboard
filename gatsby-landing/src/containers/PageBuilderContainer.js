import React from "react";
import SimpleSectionContainer from "./SimpleSectionContainer";
import SectionContainer from "./SectionContainer";
import BoxesContainer from "./BoxesContainer";
import MapContainer from "./MapContainer";
import HeroBuilderContainer from "./HeroBuilderContainer";
import TestimonialsBuilderContainer from "./TestimonialsBuilderContainer";

const componentMap = {
  boxes: BoxesContainer,
  map: MapContainer,
  hero: HeroBuilderContainer,
  testimonials: TestimonialsBuilderContainer,
};

const PageBuilderContainer = ({ pageBuilderData, testimonialsData }) => {
  if (!pageBuilderData || pageBuilderData.length === 0) {
    return null;
  }

  let sectionLikeIndex = 0;
  return (
    <>
      {pageBuilderData.map((item, index) => {
        let isAlternate = false;
        if (
          item.type === "section" ||
          item.type === "boxes" ||
          item.type === "testimonials"
        ) {
          isAlternate = sectionLikeIndex % 2 !== 0;
          sectionLikeIndex++;
        }

        if (item.type === "section") {
          // Se for o layout especial com imagem de fundo, usa o SectionContainer
          if (item.settings?.layout === "two-columns-bg-image") {
            const { title, subtitle, text, imageUrl, settings, ...rest } = item;
            const content = [];
            if (subtitle)
              content.push({ type: "preHeading", text: subtitle, order: 1 });
            if (title) content.push({ type: "heading", text: title, order: 2 });
            if (text) content.push({ type: "paragraph", text: text, order: 3 });
            if (imageUrl)
              content.push({
                type: "image",
                src: imageUrl,
                alt: title,
                order: 4,
              });

            const adaptedProps = {
              settings: { ...settings, backgroundColor: undefined },
              content,
              ...rest,
            };
            return <SectionContainer key={index} {...adaptedProps} />;
          }
          // Para todas as outras seções, usa o SimpleSectionContainer que já funcionava
          return (
            <SimpleSectionContainer
              key={index}
              {...item}
              isAlternate={isAlternate}
            />
          );
        }

        if (item.type === "testimonials") {
          return (
            <TestimonialsBuilderContainer
              key={index}
              {...item}
              testimonials={testimonialsData?.testimonials}
              isAlternate={isAlternate}
            />
          );
        }

        const Component = componentMap[item.type];
        if (!Component) {
          return null;
        }
        return <Component key={index} {...item} isAlternate={isAlternate} />;
      })}
    </>
  );
};

export default PageBuilderContainer;
