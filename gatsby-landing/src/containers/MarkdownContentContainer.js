import React from "react";
import MarkdownContent from "../components/MarkdownContent";

const MarkdownContentContainer = ({ frontmatter, html }) => {
  if (!html) {
    return null;
  }

  const hasPageBuilder =
    frontmatter.page_builder && frontmatter.page_builder.length > 0;

  if (hasPageBuilder) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-gray-100 p-8 rounded-lg shadow-md">
          <MarkdownContent html={html} />
        </div>
      </div>
    );
  }

  return <MarkdownContent html={html} />;
};

export default MarkdownContentContainer;
