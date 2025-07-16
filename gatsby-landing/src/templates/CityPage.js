import React from "react";
import LayoutContainer from "../containers/LayoutContainer";
import Seo from "../components/Seo";
import PageBuilderContainer from "../containers/PageBuilderContainer";
import MapContainer from "../containers/MapContainer";

const CityPage = ({ pageContext, location }) => {
  const { city, title, page_builder, bgImage } = pageContext;

  const mapData = {
    map: {
      src: `https://maps.google.com/maps?q=${city}&t=&z=13&ie=UTF8&iwloc=&output=embed`,
      title: `${city} Service Area`,
    },
  };

  return (
    <LayoutContainer bgImage={bgImage} pageTitle={title}>
      <PageBuilderContainer pageBuilderData={page_builder} />
      <MapContainer {...mapData} />
    </LayoutContainer>
  );
};

export const Head = ({ location, pageContext }) => {
  const { title, isDefault } = pageContext;
  const description = `Find the best window caulking services in ${title}. We offer professional sealing and weatherproofing for residential and commercial properties.`;

  const meta = [];
  if (!isDefault) {
    meta.push({ name: "robots", content: "noindex" });
  }

  return (
    <Seo
      title={title}
      description={description}
      path={location.pathname}
      meta={meta}
    />
  );
};

export default CityPage;
