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

  // pageData agora é a lista de itens da seção "landing-page"
  if (!pageData || pageData.length === 0) {
    console.warn("Nenhum item encontrado para a landing-page");
    return (
      <LayoutContainer globalData={globalData}>
        <div className="container mx-auto px-4 py-8">
          <h1>Dados da página inicial não encontrados.</h1>
        </div>
      </LayoutContainer>
    );
  }

  // Helper para encontrar os dados de um item pelo seu slug
  const getItemData = (slug) => {
    const item = pageData.find((item) => item.slug === slug);
    return item ? item.data : null;
  };

  const heroData = getItemData("hero");
  const boxesData = getItemData("boxes");
  const section1Data = getItemData("section-1");
  const section2Data = getItemData("section-2");
  const section3Data = getItemData("section-3");

  // Testimonials agora vêm dos dados globais
  const testimonialsData = globalData.testimonials;

  return (
    <LayoutContainer globalData={globalData}>
      {heroData && <HeroContainer {...heroData} />}
      {section1Data && <SectionContainer {...section1Data} />}
      {boxesData && <BoxesContainer {...boxesData} />}
      {section2Data && <SectionContainer {...section2Data} />}
      {testimonialsData && <TestimonialsContainer {...testimonialsData} />}
      <ServicesContainer servicesData={globalData.services} />
      {section3Data && <SectionContainer {...section3Data} />}
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
      description={
        globalData.site?.description ||
        "Your trusted partner for window services in Toronto."
      }
      path={location.pathname}
      navigationItems={globalData.header?.menu.data.items}
      services={globalData.services?.services}
    />
  );
};
