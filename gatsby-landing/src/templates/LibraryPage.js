import React from "react";
import LayoutContainer from "../containers/LayoutContainer";
import PageBuilderContainer from "../containers/PageBuilderContainer";
import MarkdownContentContainer from "../containers/MarkdownContentContainer";
import Seo from "../components/Seo";

const LibraryPage = ({ pageContext }) => {
  const { pageData, globalData } = pageContext;
  const { html, image, title, page_builder } = pageData;

  return (
    <LayoutContainer bgImage={image} pageTitle={title} globalData={globalData}>
      <PageBuilderContainer
        pageBuilderData={page_builder}
        testimonialsData={globalData.testimonials}
      />
      <MarkdownContentContainer frontmatter={pageData} html={html} />
    </LayoutContainer>
  );
};

export const Head = ({ location, pageContext }) => {
  const { pageData, globalData } = pageContext;

  return (
    <Seo
      site={globalData.site}
      title={pageData.title}
      description={pageData.description}
      path={location.pathname}
      navigationItems={globalData.header.menu.data.items}
      services={globalData.services.services}
    />
  );
};

export default LibraryPage;
