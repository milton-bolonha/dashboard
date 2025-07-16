import React from "react";
import Section from "../components/Section";

const FormPlaceholder = ({ form }) => (
  <div className="pt-8">
    <div className="bg-white rounded-xl shadow-2xl p-8 animate-fade-in w-full">
      <div className="text-center p-6 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
        <div className="text-3xl mb-3">📋</div>
        <p className="text-sm text-gray-600">
          <strong>JotForm ID:</strong> {form.formData?.formId}
        </p>
        <p className="text-xs text-gray-500 mt-1">JotForm Placeholder</p>
      </div>
    </div>
  </div>
);

const SimpleSectionContainer = ({
  title,
  subtitle,
  text,
  imageUrl,
  form,
  textPosition = "center",
  isAlternate = false,
  sectionId,
}) => {
  const content = [];

  // Conteúdo de texto sempre é adicionado
  if (subtitle) content.push({ type: "preHeading", text: subtitle });
  if (title) content.push({ type: "heading", text: title });
  if (text) content.push({ type: "paragraph", text: text });

  // O formulário é adicionado ao conteúdo de texto
  if (form && form.formType) {
    content.push({
      type: "custom",
      component: () => <FormPlaceholder form={form} />,
    });
  }

  // A imagem é adicionada separadamente
  if (imageUrl) {
    content.push({
      type: "image",
      src: imageUrl,
      alt: title || "Section Image",
    });
  }

  const settings = {
    backgroundColor: isAlternate ? "bg-gray-50" : undefined,
    sectionId: sectionId,
    layout: imageUrl ? "two-columns" : "boxed",
    textAlignment: imageUrl ? "left" : "center",
    imageSide: textPosition === "left" ? "right" : "left",
  };

  return <Section content={content} settings={settings} />;
};

export default SimpleSectionContainer;
