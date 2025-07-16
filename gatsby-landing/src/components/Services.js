import React from "react";
import { Link } from "gatsby";
import { WrenchScrewdriverIcon } from "@heroicons/react/24/outline";

const Services = ({ heading, services = [] }) => {
  if (services.length === 0) {
    return null;
  }

  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-12">{heading}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service, index) => (
            <Link
              key={index}
              to="/services/"
              className="bg-white p-6 rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 flex flex-col text-center items-center"
            >
              <div className="bg-blue-100 rounded-full p-4 mb-4">
                <WrenchScrewdriverIcon className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                {service.name}
              </h3>
              <p className="text-gray-600 text-sm flex-grow">
                {service.description}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Services;
