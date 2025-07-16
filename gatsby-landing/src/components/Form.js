import React from "react";

const Form = ({ heading, subheading, formType, formData, postFormContent }) => {
  if (!heading && !subheading) return null;

  const renderFormContent = () => {
    switch (formType) {
      case "jotform":
        return (
          <div className="text-center p-6 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300">
            <div className="text-3xl mb-3">📋</div>
            <p className="text-sm text-gray-700">
              <strong>JotForm ID:</strong> {formData?.formId}
            </p>
            <p className="text-xs text-gray-600 mt-1">JotForm placeholder</p>
          </div>
        );
      default:
        return (
          <div className="text-center p-6 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300">
            <p>Formulário não configurado</p>
          </div>
        );
    }
  };

  return (
    <div className="flex flex-col space-y-5">
      {/* O Título e Subtítulo do formulário foram removidos daqui
          Eles agora serão controlados como elementos normais (heading, subHeading) na seção
          para maior flexibilidade de ordenação. */}
      {renderFormContent()}
      {postFormContent && (
        <div className="p-3 bg-green-100 text-green-800 text-sm rounded-lg text-center">
          ✅ {postFormContent}
        </div>
      )}
    </div>
  );
};

export default Form;
