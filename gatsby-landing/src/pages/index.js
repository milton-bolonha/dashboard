import React from "react";
import LayoutContainer from "../containers/LayoutContainer";
import HeroContainer from "../containers/HeroContainer";
import SectionContainer from "../containers/SectionContainer";
import BoxesContainer from "../containers/BoxesContainer";
import Seo from "../components/Seo";
import ServicesContainer from "../containers/ServicesContainer";

// Importar dados do site para SEO
import siteData from "../../content/site.json";
import headerData from "../../content/header.json";
import servicesData from "../../content/services.json";

// Importar dados dos JSONs
import heroData from "../../content/landing-page/hero.json";
import section1Data from "../../content/landing-page/section-1.json";
import section2Data from "../../content/landing-page/section-2.json";
// import section3Data from "../../content/landing-page/section-3.json";
import boxesData from "../../content/landing-page/boxes.json";
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
  <Seo
    site={siteData}
    title="Home"
    description="Your trusted partner for window caulking in Toronto. We serve residential and commercial clients with top-quality materials and professional service. Contact us for a free estimate."
    path={location.pathname}
    navigationItems={headerData.menu.data.items}
    services={servicesData.services}
  />
);
