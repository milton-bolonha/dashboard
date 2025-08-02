import React from "react";
import Footer from "../components/Footer";

const FooterContainer = ({ footer, cities, services }) => {
  if (!footer) {
    return null;
  }

  const citiesData = {
    heading: "Service Areas",
    cities: cities ? cities.map((city) => city.name) : [],
  };

  const servicesData = services || {};

  return (
    <Footer
      citiesData={citiesData}
      servicesData={servicesData}
      footerData={footer}
    />
  );
};

export default FooterContainer;
