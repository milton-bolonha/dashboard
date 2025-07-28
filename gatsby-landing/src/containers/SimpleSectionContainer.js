import React from "react";
import Section from "../components/Section";
// import JotformEmbed from "../components/JotformEmbed";

const SimpleSectionContainer = ({
  title,
  subtitle,
  text,
  imageUrl,
  form,
  textPosition = "center",
  isAlternate = false,
  sectionId,
  settings = {},
}) => {
  const content = [];

  if (subtitle) content.push({ type: "preHeading", text: subtitle });
  if (title) content.push({ type: "heading", text: title });
  if (text) content.push({ type: "paragraph", text: text });

  if (form && form.formType === "jotform" && form.formData?.formId) {
    content.push({
      type: "custom",
      component: () => (
        <div className="pt-8 w-full">
          {/* <JotformEmbed
            src={`https://form.jotform.com/${form.formData.formId}`}
          /> */}
        </div>
      ),
    });
  }

  if (imageUrl) {
    content.push({
      type: "image",
      src: imageUrl,
      alt: title || "Section Image",
    });
  }

  const sectionSettings = {
    backgroundColor: isAlternate && !settings.layout ? "bg-gray-50" : undefined,
    sectionId: sectionId,
    layout: settings.layout || (imageUrl ? "two-columns" : "boxed"),
    textAlignment: settings.textAlignment || (imageUrl ? "left" : "center"),
    imageSide:
      settings.imageSide || (textPosition === "left" ? "right" : "left"),
    imageWidth: settings.imageWidth,
  };

  return <Section content={content} settings={sectionSettings} />;
};

export default SimpleSectionContainer;
