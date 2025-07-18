import React from "react";
import { graphql } from "gatsby";
import LayoutContainer from "../containers/LayoutContainer";
import PageBuilderContainer from "../containers/PageBuilderContainer";
import MarkdownContentContainer from "../containers/MarkdownContentContainer";
import Seo from "../components/Seo";
import TopBarContainer from "../containers/TopBarContainer";
import topbarData from "../../content/topbar.json";
import topbarGray from "../../content/topbar-example-gray.json";
import topbarRed from "../../content/topbar-example-red.json";
import topbarGreen from "../../content/topbar-example-green.json";

// Importar dados do site para SEO
import siteData from "../../content/site.json";
import headerData from "../../content/header.json";
import servicesData from "../../content/services.json";

const LibraryPage = ({ data }) => {
  const { markdownRemark } = data;
  const { frontmatter, html } = markdownRemark;

  return (
    <LayoutContainer bgImage={frontmatter.image} pageTitle={frontmatter.title}>
      {/* Exemplos de TopBar */}
      <div className="space-y-4 my-8">
        <h2 className="text-2xl font-bold text-center">TopBar Examples</h2>
        <TopBarContainer {...topbarGray} bgColor="bg-gray-800" />
        <TopBarContainer {...topbarRed} bgColor="bg-red-600" />
        <TopBarContainer {...topbarGreen} bgColor="bg-green-600" />
        <TopBarContainer {...topbarData} />
      </div>

      <PageBuilderContainer pageBuilderData={frontmatter.page_builder} />
      <MarkdownContentContainer frontmatter={frontmatter} html={html} />
    </LayoutContainer>
  );
};

export const Head = ({ location, data }) => (
  <Seo
    site={siteData}
    title={data.markdownRemark.frontmatter.title}
    description={data.markdownRemark.frontmatter.description}
    path={location.pathname}
    navigationItems={headerData.menu.data.items}
    services={servicesData.services}
  />
);

export const pageQuery = graphql`
  query ($slug: String!) {
    markdownRemark(fields: { slug: { eq: $slug } }) {
      html
      frontmatter {
        title
        description
        image
        page_builder {
          type
          title
          subtitle
          text
          imageUrl
          textPosition
          sectionId
          boxes {
            title
            text
          }
          form {
            formType
            formData {
              formId
            }
          }
          map {
            src
            title
          }
          hero {
            background {
              image
            }
            heading {
              level
              text
            }
            subHeading {
              level
              text
            }
            textSlider {
              heading
              content
              button {
                label
                link
              }
            }
            form {
              formType
              formData {
                formId
              }
            }
            textPosition
          }
        }
      }
    }
  }
`;

export default LibraryPage;
