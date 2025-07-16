import React from "react";
import Services from "../components/Services";
import servicesData from "../../content/services.json";

const ServicesContainer = () => {
  if (!servicesData || !servicesData.services) {
    return null;
  }

  // Filtra os serviços para incluir apenas aqueles que têm uma descrição não vazia
  const servicesWithDescription = servicesData.services.filter(
    (service) => service.description && service.description.trim() !== ""
  );

  if (servicesWithDescription.length === 0) {
    return null;
  }

  return (
    <Services
      heading={servicesData.heading}
      services={servicesWithDescription}
    />
  );
};

export default ServicesContainer;
