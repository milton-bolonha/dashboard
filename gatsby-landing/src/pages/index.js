import React from "react";
import LayoutContainer from "../containers/LayoutContainer";
import HeroContainer from "../containers/HeroContainer";
import SectionContainer from "../containers/SectionContainer";
import BoxesContainer from "../containers/BoxesContainer";
import Seo from "../components/Seo";
import ServicesContainer from "../containers/ServicesContainer";

// Importar dados dos JSONs
import heroData from "../../content/hero.json";
import section1Data from "../../content/section-1.json";
import section2Data from "../../content/section-2.json";
// import section3Data from "../../content/section-3.json";
import boxesData from "../../content/boxes.json";
import TestimonialsContainer from "../containers/TestimonialsContainer";

const IndexPage = () => {
  return (
    <LayoutContainer>
      <HeroContainer {...heroData} />
      <BoxesContainer {...boxesData} />
      <TestimonialsContainer />
      <SectionContainer {...section1Data} />
      <ServicesContainer />
      <SectionContainer {...section2Data} />
      {/* <SectionContainer {...section3Data} /> */}
    </LayoutContainer>
  );
};

export default IndexPage;

export const Head = ({ location }) => (
  <Seo title="Home" path={location.pathname} />
);
