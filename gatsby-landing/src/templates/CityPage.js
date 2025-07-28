import React from "react";
import LayoutContainer from "../containers/LayoutContainer";
import PageBuilderContainer from "../containers/PageBuilderContainer";
import Seo from "../components/Seo";

const CityPage = ({ pageContext }) => {
  const { city, templateData, globalData } = pageContext;

  const title = templateData.data.title.replace(/\[city\]/g, city.name);
  let pageBuilderData = templateData.data.page_builder || [];

  if (pageBuilderData) {
    pageBuilderData = JSON.parse(
      JSON.stringify(pageBuilderData).replace(/\[city\]/g, city.name)
    );
  }

  return (
    <LayoutContainer
      bgImage={templateData.data.image}
      pageTitle={title}
      globalData={globalData}
    >
      <PageBuilderContainer pageBuilderData={pageBuilderData} />
    </LayoutContainer>
  );
};

export const Head = ({ location, pageContext }) => {
  const { city, templateData, globalData } = pageContext;
  const title = templateData.data.title.replace(/\[city\]/g, city.name);

  return (
    <Seo
      site={globalData.site}
      title={title}
      description={`Find the best ${title} in your area.`}
      path={location.pathname}
      navigationItems={globalData.header.menu.data.items}
      services={globalData.services.services}
    />
  );
};

export default CityPage;
