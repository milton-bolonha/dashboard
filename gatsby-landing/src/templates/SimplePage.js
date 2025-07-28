import React from "react";
import LayoutContainer from "../containers/LayoutContainer";
import PageBuilderContainer from "../containers/PageBuilderContainer";
import MarkdownContentContainer from "../containers/MarkdownContentContainer";
import Seo from "../components/Seo";

const SimplePage = ({ pageContext }) => {
  const { pageData, globalData } = pageContext;
  const { data, html } = pageData;

  return (
    <LayoutContainer
      bgImage={data.image}
      pageTitle={data.name}
      globalData={globalData}
    >
      <PageBuilderContainer pageBuilderData={data.page_builder} />
      {html && (
        <div className="container mx-auto px-4 py-8">
          <MarkdownContentContainer frontmatter={data} html={html} />
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
