import React from "react";
import { graphql } from "gatsby";
import LayoutContainer from "../containers/LayoutContainer";
import PageBuilderContainer from "../containers/PageBuilderContainer";
import MarkdownContentContainer from "../containers/MarkdownContentContainer";
import Seo from "../components/Seo";

const CustomPage = ({ data }) => {
  const { markdownRemark } = data;
  const { frontmatter, html } = markdownRemark;

  return (
    <LayoutContainer bgImage={frontmatter.image} pageTitle={frontmatter.title}>
      <PageBuilderContainer pageBuilderData={frontmatter.page_builder} />

      <div className="container mx-auto px-4 py-8">
        <MarkdownContentContainer frontmatter={frontmatter} html={html} />
        {frontmatter.address && (
          <p className="text-lg mb-2">{frontmatter.address}</p>
        )}
        {frontmatter.phone && <p className="text-lg">{frontmatter.phone}</p>}
      </div>
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
        address
        phone
        page_builder {
          type
          title
          subtitle
          text
          imageUrl
          textPosition
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
          sectionId
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

export default CustomPage;
