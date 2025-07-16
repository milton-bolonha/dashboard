import React from "react";
import SimpleSectionContainer from "./SimpleSectionContainer";
import BoxesContainer from "./BoxesContainer";
import MapContainer from "./MapContainer";
import HeroBuilderContainer from "./HeroBuilderContainer";
import TestimonialsBuilderContainer from "./TestimonialsBuilderContainer";

const componentMap = {
  section: SimpleSectionContainer,
  boxes: BoxesContainer,
  map: MapContainer,
  hero: HeroBuilderContainer,
  testimonials: TestimonialsBuilderContainer,
};

const PageBuilderContainer = ({ pageBuilderData }) => {
  if (!pageBuilderData || pageBuilderData.length === 0) {
    return null;
  }

  let sectionLikeIndex = 0;
  return (
    <>
      {pageBuilderData.map((item, index) => {
        const Component = componentMap[item.type];
        if (!Component) {
          return null;
        }

        let isAlternate = false;
        if (
          item.type === "section" ||
          item.type === "boxes" ||
          item.type === "testimonials"
        ) {
          isAlternate = sectionLikeIndex % 2 !== 0;
          sectionLikeIndex++;
        }

        return <Component key={index} {...item} isAlternate={isAlternate} />;
      })}
    </>
  );
};

export default PageBuilderContainer;
