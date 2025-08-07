import React from "react";
import { Input } from "@/components/ui/Input";
import CloudinaryUploadField from "@/components/ui/CloudinaryUploadField";
import CloudinaryGalleryField from "@/components/ui/CloudinaryGalleryField";

// A importação do RecursiveFormRenderer é movida para os arquivos que o utilizam diretamente (group/repeater)
// para evitar dependências circulares.

const FieldRenderer = ({
  addon,
  value,
  onChange,
  path,
  workspaceSlug,
  sectionSlug,
}) => {
  const fieldProps = {
    name: path.join("."),
    value: value ?? "",
    onChange: onChange,
    required: addon.required,
  };

  const renderField = () => {
    switch (addon.type) {
      case "textInput":
        return (
          <Input
            type="text"
            {...fieldProps}
            placeholder={
              addon.placeholder || `Digite ${addon.label.toLowerCase()}...`
            }
          />
        );
      case "textarea":
        return (
          <textarea
            {...fieldProps}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white transition-colors resize-y"
            placeholder={
              addon.placeholder || `Digite ${addon.label.toLowerCase()}...`
            }
          />
        );
      case "numberInput":
        return (
          <Input
            type="number"
            {...fieldProps}
            min={addon.config?.min}
            max={addon.config?.max}
            step={addon.config?.step || 1}
            placeholder={addon.placeholder || "Digite um número..."}
          />
        );
      case "dateInput":
        return <Input type="date" {...fieldProps} />;
      case "checkbox":
        return (
          <div className="flex items-start space-x-3">
            <input
              type="checkbox"
              name={fieldProps.name}
              checked={!!value}
              onChange={(e) =>
                onChange({
                  target: { name: fieldProps.name, value: e.target.checked },
                })
              }
              className="mt-1 w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 transition-colors"
            />
            {/* O label já é renderizado fora, aqui podemos remover se duplicado */}
          </div>
        );
      case "selectInput":
        const options = addon.config?.options || [];
        return (
          <select
            {...fieldProps}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white transition-colors"
          >
            <option value="">Selecione...</option>
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        );
      case "cloudinaryUpload":
        return (
          <CloudinaryUploadField
            addon={addon}
            value={value}
            onChange={onChange}
            path={path}
            workspaceSlug={workspaceSlug}
            sectionSlug={sectionSlug}
          />
        );
      case "cloudinaryGallery":
        return (
          <CloudinaryGalleryField
            addon={addon}
            value={value}
            onChange={onChange}
            path={path}
            workspaceSlug={workspaceSlug}
            sectionSlug={sectionSlug}
          />
        );
      default:
        return (
          <p className="text-red-500">
            Tipo de campo desconhecido: {addon.type}
          </p>
        );
    }
  };

  return (
    <div key={fieldProps.name} className="mb-4">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        {addon.label}{" "}
        {addon.required && <span className="text-red-500">*</span>}
      </label>
      {addon.helpText && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
          {addon.helpText}
        </p>
      )}
      {renderField()}
    </div>
  );
};

export default FieldRenderer;
