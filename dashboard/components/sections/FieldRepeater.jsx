import React from "react";
import RecursiveFormRenderer from "./RecursiveFormRenderer"; // Corrigindo o import
import Button from "@/components/ui/Button";
import set from "lodash/set";

const FieldRepeater = ({
  addon,
  value,
  onChange,
  path,
  workspaceSlug,
  sectionSlug,
}) => {
  const items = Array.isArray(value) ? value : [];

  // ✅ DEBUG: Log para investigar o problema
  console.log("🔍 DEBUG: FieldRepeater", {
    addonName: addon.name,
    addonType: addon.type,
    value: value,
    valueType: typeof value,
    isArray: Array.isArray(value),
    items: items,
    itemsLength: items.length,
  });

  const handleAddItem = () => {
    const newItem = {}; // Inicializar com objeto vazio, poderia ter valores padrão
    const newItems = [...items, newItem];
    onChange({ target: { name: path.join("."), value: newItems } });
  };

  const handleRemoveItem = (index) => {
    const newItems = items.filter((_, i) => i !== index);
    onChange({ target: { name: path.join("."), value: newItems } });
  };

  return (
    <fieldset className="mb-6 border border-gray-300 dark:border-gray-600 rounded-lg p-4">
      <legend className="text-lg font-medium text-gray-900 dark:text-white px-2">
        {addon.label}
      </legend>

      {items.map((item, index) => (
        <div
          key={index}
          className="mb-4 p-4 border-b border-gray-200 dark:border-gray-700 relative"
        >
          <RecursiveFormRenderer
            addons={addon.fields}
            formData={item} // Passa o item atual do array como formData
            handleAddonChange={(e) => {
              const { name, value: fieldValue } = e.target;
              const newItems = JSON.parse(JSON.stringify(items)); // Deep copy
              // O 'name' já vem com o caminho aninhado do FieldRenderer (ex: 'data.src')
              set(newItems[index], name, fieldValue);
              onChange({ target: { name: path.join("."), value: newItems } });
            }}
            path={[]} // Começa um novo caminho relativo dentro do item do repeater
            workspaceSlug={workspaceSlug}
            sectionSlug={sectionSlug}
          />
          <Button
            variant="outline"
            size="small"
            onClick={() => handleRemoveItem(index)}
            className="absolute top-4 right-4 text-red-500"
          >
            Remover
          </Button>
        </div>
      ))}

      <Button type="button" onClick={handleAddItem}>
        Adicionar {addon.label}
      </Button>
    </fieldset>
  );
};

export default FieldRepeater;
