import React from "react";
import LayoutContainer from "../containers/LayoutContainer";
import PageBuilderContainer from "../containers/PageBuilderContainer";
import MarkdownContentContainer from "../containers/MarkdownContentContainer";
import Seo from "../components/Seo";

const CustomPage = ({ pageContext }) => {
  const { pageData } = pageContext;
  const { data, html } = pageData; // 'data' contém o frontmatter, 'html' o conteúdo markdown

  return (
    <LayoutContainer
      bgImage={data.image}
      pageTitle={data.name}
      // Dados globais agora vêm do pageContext e são passados para o Layout
      globalData={pageContext.globalData}
    >
      <PageBuilderContainer pageBuilderData={data.page_builder} />

      <div className="container mx-auto px-4 py-8">
        <MarkdownContentContainer frontmatter={data} html={html} />
        {data.address && <p className="text-lg mb-2">{data.address}</p>}
        {data.phone && <p className="text-lg">{data.phone}</p>}
      </div>
    </LayoutContainer>
  );
};

export const Head = ({ location, pageContext }) => (
  <Seo
    // O componente SEO também receberá os dados globais via props
    site={pageContext.globalData.site}
    title={pageContext.pageData.name}
    description={pageContext.pageData.description}
    path={location.pathname}
    navigationItems={pageContext.globalData.header.menu.data.items}
    services={pageContext.globalData.services.services}
  />
);

export default CustomPage;
