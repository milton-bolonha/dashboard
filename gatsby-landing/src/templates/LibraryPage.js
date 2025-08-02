import React from "react";
import LayoutContainer from "../containers/LayoutContainer";
import PageBuilderContainer from "../containers/PageBuilderContainer";
import MarkdownContentContainer from "../containers/MarkdownContentContainer";
import Seo from "../components/Seo";

const LibraryPage = ({ pageContext }) => {
  const { pageData, globalData } = pageContext;
  const { data, html } = pageData;

  return (
    <LayoutContainer
      bgImage={data.image}
      pageTitle={data.name}
      globalData={globalData}
    >
      <PageBuilderContainer
        pageBuilderData={data.page_builder}
        testimonialsData={globalData.testimonials}
      />
      <MarkdownContentContainer frontmatter={data} html={html} />
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

export default LibraryPage;
