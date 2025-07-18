import React from "react";
import Services from "../components/Services";
import servicesData from "../../content/services.json";

const classicSlugs = [
  "awning-windows-caulking",
  "bay-window-caulking",
  "casement-window-caulking",
  "horizontal-vertical-slider-caulking",
  "patio-doors-caulking",
  "specialty-windows-caulking",
];

const ServicesContainer = () => {
  if (!servicesData || !servicesData.services) {
    return null;
  }

  // Filtra para mostrar só os seis clássicos na home
  const classicServices = servicesData.services.filter((service) =>
    classicSlugs.includes(service.slug)
  );

  if (classicServices.length === 0) {
    return null;
  }

  return <Services heading={servicesData.heading} services={classicServices} />;
};

export default ServicesContainer;
