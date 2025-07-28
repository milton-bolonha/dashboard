import React from "react";
import LayoutContainer from "../containers/LayoutContainer";
import HeroContainer from "../containers/HeroContainer";
import SectionContainer from "../containers/SectionContainer";
import BoxesContainer from "../containers/BoxesContainer";
import Seo from "../components/Seo";
import ServicesContainer from "../containers/ServicesContainer";
import TestimonialsContainer from "../containers/TestimonialsContainer";

const HomePage = ({ pageContext }) => {
  const { pageData, globalData } = pageContext;

  // Encontra a seção landing-page que contém todos os dados da página inicial
  const landingPageSection = pageData.find(
    (s) =>
      s.slug === "landing-page" ||
      s.title === "Landing-page" ||
      s.slug === "" ||
      (s.items &&
        s.items.some((item) =>
          ["hero", "boxes", "section-1"].includes(item.slug)
        ))
  );

  // Encontra a seção de testimonials
  const testimonialsSection = pageData.find((s) => s.slug === "testimonials");

  if (!landingPageSection || !landingPageSection.items) {
    console.warn("Seção landing-page não encontrada na API");
    return (
      <LayoutContainer globalData={globalData}>
        <div className="container mx-auto px-4 py-8">
          <h1>Dados da página inicial não encontrados</h1>
        </div>
      </LayoutContainer>
    );
  }

  // Extrai os dados de cada item da landing page
  const getItemData = (slug) => {
    const item = landingPageSection.items.find((item) => item.slug === slug);
    return item ? item.data : null;
  };

  const heroData = getItemData("hero");
  const boxesData = getItemData("boxes");
  const section1Data = getItemData("section-1");
  const section2Data = getItemData("section-2");
  const testimonialsData = testimonialsSection?.items[0]?.data; // Busca na seção de testimonials

  return (
    <LayoutContainer globalData={globalData}>
      {heroData && <HeroContainer {...heroData} />}
      {boxesData && <BoxesContainer {...boxesData} />}
      {testimonialsData && <TestimonialsContainer {...testimonialsData} />}
      {section1Data && <SectionContainer {...section1Data} />}
      <ServicesContainer />
      {section2Data && <SectionContainer {...section2Data} />}
    </LayoutContainer>
  );
};

export default HomePage;

export const Head = ({ location, pageContext }) => {
  const { globalData } = pageContext;
  return (
    <Seo
      site={globalData.site}
      title="Home"
      description="Your trusted partner for window caulking in Toronto. We serve residential and commercial clients with top-quality materials and professional service. Contact us for a free estimate."
      path={location.pathname}
      navigationItems={globalData.header.menu.data.items}
      services={globalData.services.services}
    />
  );
};
