import React from "react";
import Footer from "../components/Footer";

import rawCitiesData from "../../content/cities/cities.json";
import servicesData from "../../content/services.json";
import footerData from "../../content/footer.json";

const FooterContainer = () => {
  const citiesData = {
    heading: "Service Areas", // You can customize this heading
    cities: rawCitiesData.map(city => city.name)
  };

  return (
    <Footer
      citiesData={citiesData}
      servicesData={servicesData}
      footerData={footerData}
    />
  );
};


export default FooterContainer;
