import React from "react";
import { buildCloudinaryUrl } from "../lib/cloudinary";
import LayoutContainer from "../containers/LayoutContainer";
import PageBuilderContainer from "../containers/PageBuilderContainer";
import MarkdownContentContainer from "../containers/MarkdownContentContainer";
import Seo from "../components/Seo";

const SimplePage = ({ pageContext }) => {
  const { pageData, globalData } = pageContext;
  const { html } = pageData; // pageData *é* o objeto de dados

  const backgroundImageUrl = buildCloudinaryUrl(pageData?.image, {
    width: 1920,
    quality: "auto",
    format: "auto",
  });

  return (
    <LayoutContainer
      bgImage={backgroundImageUrl}
      pageTitle={pageData?.title}
      globalData={globalData}
    >
      <PageBuilderContainer pageBuilderData={pageData?.page_builder} />
      {html && (
        <div className="container mx-auto px-4 py-8">
          <MarkdownContentContainer frontmatter={pageData} html={html} />
        </div>
      )}
    </LayoutContainer>
  );
};

export const Head = ({ location, pageContext }) => {
  const { pageData, globalData } = pageContext;

  return (
    <Seo
      site={globalData.site}
      title={pageData.name}
      description={pageData.description}
      path={location.pathname}
      navigationItems={globalData.header.menu.data.items}
      services={globalData.services.services}
    />
  );
};

export default SimplePage;
