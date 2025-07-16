import React from "react";
import { graphql } from "gatsby";
import LayoutContainer from "../containers/LayoutContainer";
import PageBuilderContainer from "../containers/PageBuilderContainer";
import MarkdownContentContainer from "../containers/MarkdownContentContainer";
import Seo from "../components/Seo";

const LibraryPage = ({ data }) => {
  const { markdownRemark } = data;
  const { frontmatter, html } = markdownRemark;

  return (
    <LayoutContainer bgImage={frontmatter.image} pageTitle={frontmatter.title}>
      <PageBuilderContainer pageBuilderData={frontmatter.page_builder} />
      <MarkdownContentContainer frontmatter={frontmatter} html={html} />
    </LayoutContainer>
  );
};

export const Head = ({ location, data }) => (
  <Seo
    title={data.markdownRemark.frontmatter.title}
    description={data.markdownRemark.frontmatter.description}
    path={location.pathname}
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
