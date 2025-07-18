import React from "react";

const Map = ({ src, title = "Location Map" }) => {
  if (!src) {
    return null;
  }

  return (
    <section className="py-16 md:py-24 bg-gray-50">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-gray-900 text-center mb-8">
          Our Location
        </h2>
        <div className="rounded-lg shadow-xl overflow-hidden">
          <iframe
            src={src}
            title={title}
            width="100%"
            height="450"
            frameBorder="0"
            style={{ border: 0 }}
            allowFullScreen=""
            aria-hidden="false"
          ></iframe>
        </div>
      </div>
    </section>
  );
};

export default Map;
