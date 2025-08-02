import React from "react";
import Services from "../components/Services";

const classicSlugs = [
  "awning-bubble-window-installation",
  "bay-bubble-window-replacement",
  "casement-bubble-window-sealing",
  "sliding-bubble-panels",
  "bubble-patio-panels",
  "custom-bubble-window-shapes",
];

const ServicesContainer = ({ servicesData }) => {
  if (!servicesData || !servicesData.services) {
    return null;
  }

  const classicServices = servicesData.services.filter((service) =>
    classicSlugs.includes(service.slug)
  );

  if (classicServices.length === 0) {
    return null;
  }

  return <Services heading={servicesData.heading} services={classicServices} />;
};

export default ServicesContainer;
