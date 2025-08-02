import React from "react";
import { buildCloudinaryUrl } from "../lib/cloudinary";
import LayoutContainer from "../containers/LayoutContainer";
import PageBuilderContainer from "../containers/PageBuilderContainer";
import MarkdownContentContainer from "../containers/MarkdownContentContainer";
import Seo from "../components/Seo";

const CustomPage = ({ pageContext }) => {
  const { pageData, globalData } = pageContext;
  // pageData *é* o objeto de dados, que inclui o `html` do markdown

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

      <div className="container mx-auto px-4 py-8">
        <MarkdownContentContainer
          frontmatter={pageData}
          html={pageData?.html}
        />
        {pageData?.address && (
          <p className="text-lg mb-2">{pageData.address}</p>
        )}
        {pageData?.phone && <p className="text-lg">{pageData.phone}</p>}
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
