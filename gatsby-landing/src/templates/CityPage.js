import React from "react";
import { buildCloudinaryUrl } from "../lib/cloudinary";
import LayoutContainer from "../containers/LayoutContainer";
import Seo from "../components/Seo";
import PageBuilderContainer from "../containers/PageBuilderContainer";
import MapContainer from "../containers/MapContainer";
import FAQContainer from "../containers/FAQContainer";
import MarkdownContent from "../components/MarkdownContent";

const CityPage = ({ pageContext, location }) => {
  const { city, headline, page_builder, bgImage, body, globalData } =
    pageContext;

  const backgroundImageUrl = buildCloudinaryUrl(bgImage, {
    width: 1920,
    quality: "auto",
    format: "auto",
  });

  const mapData = {
    map: {
      src: `https://maps.google.com/maps?q=${city}&t=&z=13&ie=UTF8&iwloc=&output=embed`,
      title: `${city} Service Area`,
    },
  };

  const faqs = page_builder
    ? page_builder
        .filter((section) => section.type === "faq")
        .map((section) => ({ q: section.q, a: section.a }))
    : [];

  const pageBuilderWithoutFaqs = page_builder
    ? page_builder.filter((section) => section.type !== "faq")
    : [];

  return (
    <LayoutContainer
      bgImage={backgroundImageUrl}
      pageTitle={headline}
      globalData={globalData}
    >
      <PageBuilderContainer pageBuilderData={pageBuilderWithoutFaqs} />
      <MapContainer {...mapData} />
      {body && (
        <div className="container mx-auto px-4 py-8 mb-16">
          <div className="bg-gray-100 p-6 rounded-lg shadow-md max-w-2xl mx-auto">
            <div className="prose max-w-none inner-content text-center">
              <MarkdownContent html={body} />
            </div>
          </div>
        </div>
      )}
      {faqs.length > 0 && <FAQContainer faqs={faqs} />}
    </LayoutContainer>
  );
};

export const Head = ({ location, pageContext }) => {
  const {
    city,
    title,
    bgImage,
    defaultCityUrl,
    isDefault,
    page_builder,
    globalData,
  } = pageContext;
  const description = `Find the best window caulking services in ${city}. We offer professional sealing and weatherproofing for residential and commercial properties.`;

  const faqs = page_builder
    ? page_builder
        .filter((section) => section.type === "faq")
        .map((section) => ({ q: section.q, a: section.a }))
    : [];

  return (
    <Seo
      site={globalData.site}
      title={title}
      description={description}
      path={location.pathname}
      canonicalUrlOverride={defaultCityUrl}
      image={bgImage}
      navigationItems={globalData.header.menu.data.items}
      services={globalData.services.services}
      noindex={!isDefault}
      faqs={faqs}
    />
  );
};

export default CityPage;
