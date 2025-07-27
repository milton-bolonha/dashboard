import React, { useState } from "react";
import Button from "@/components/ui/Button";

const FileSelectionInterface = ({
  availableFiles,
  selectedFiles,
  onSelectFile,
  onDeselectFile,
  onSelectAll,
  onDeselectAll,
  onConfirmSelection,
  onCancel,
}) => {
  const [expandedSections, setExpandedSections] = useState({});

  // Agrupar items por sectionId
  function groupItemsBySection(files) {
    const items = files.filter((f) => f.type === "item");
    const grouped = {};
    items.forEach((item) => {
      const sectionKey = item.data.sectionId || "__no_section__";
      if (!grouped[sectionKey]) grouped[sectionKey] = [];
      grouped[sectionKey].push(item);
    });
    return grouped;
  }

  // Separar sections
  const allSections = availableFiles.filter((f) => f.type === "section");
  const allItems = availableFiles.filter((f) => f.type === "item");
  const itemsBySection = groupItemsBySection(availableFiles);

  // Seleção
  const selectedIds = new Set(selectedFiles.map((f) => f.id));
  const isSectionSelected = (section) => selectedIds.has(section.id);
  const isItemSelected = (item) => selectedIds.has(item.id);

  // Marcar/desmarcar section: todos os items dela
  const handleSectionCheckbox = (section, checked) => {
    if (checked) {
      onSelectFile(section.id);
      const sectionItems =
        itemsBySection[
          section.data?.slug || section.data?.name || section.name
        ] || [];
      sectionItems.forEach((item) => {
        onSelectFile(item.id);
      });
    } else {
      onDeselectFile(section.id);
      const sectionItems =
        itemsBySection[
          section.data?.slug || section.data?.name || section.name
        ] || [];
      sectionItems.forEach((item) => {
        onDeselectFile(item.id);
      });
    }
  };
  // Marcar/desmarcar item: se todos marcados, marca section; se nenhum, desmarca section
  const handleItemCheckbox = (item, section, checked) => {
    if (checked) {
      onSelectFile(item.id);
      const sectionKey =
        section.data?.slug || section.data?.name || section.name;
      const items = itemsBySection[sectionKey] || [];
      const allSelected = items.every(
        (i) => selectedIds.has(i.id) || i.id === item.id
      );
      if (allSelected) onSelectFile(section.id);
    } else {
      onDeselectFile(item.id);
      const sectionKey =
        section.data?.slug || section.data?.name || section.name;
      const items = itemsBySection[sectionKey] || [];
      const anySelected = items.some(
        (i) => i.id !== item.id && selectedIds.has(i.id)
      );
      if (!anySelected) onDeselectFile(section.id);
    }
  };

  // Select/Deselect All
  const handleSelectAll = () => {
    allSections.forEach((section) => {
      if (!isSectionSelected(section)) onSelectFile(section.id);
      (
        itemsBySection[
          section.data?.slug || section.data?.name || section.name
        ] || []
      ).forEach((item) => {
        if (!isItemSelected(item)) onSelectFile(item.id);
      });
    });
  };
  const handleDeselectAll = () => {
    allSections.forEach((section) => {
      if (isSectionSelected(section)) onDeselectFile(section.id);
      (
        itemsBySection[
          section.data?.slug || section.data?.name || section.name
        ] || []
      ).forEach((item) => {
        if (isItemSelected(item)) onDeselectFile(item.id);
      });
    });
  };

  // Expand/collapse
  const toggleSection = (sectionId) => {
    setExpandedSections((prev) => ({ ...prev, [sectionId]: !prev[sectionId] }));
  };

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h2 className="text-xl font-semibold mb-2">
          Selecionar Arquivos para Importar
        </h2>
        <p className="text-gray-600 text-sm">
          Selecione as Sections e Items desejados. Expanda uma section para ver
          seus items.
        </p>
      </div>
      {/* Ações globais */}
      <div className="flex justify-center gap-4 mb-2">
        <Button
          onClick={handleSelectAll}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white"
        >
          Selecionar Tudo
        </Button>
        <Button
          onClick={handleDeselectAll}
          className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white"
        >
          Remover Tudo
        </Button>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full border rounded-lg bg-white">
          <thead>
            <tr className="bg-gray-100">
              <th className="px-4 py-2 text-left">Section / Item</th>
              <th className="px-4 py-2 text-left">Selecionar</th>
            </tr>
          </thead>
          <tbody>
            {allSections.map((section) => (
              <React.Fragment key={section.id}>
                <tr className="border-b">
                  <td className="px-4 py-2 align-top">
                    <button
                      type="button"
                      className="mr-2 text-blue-600 hover:text-blue-800 focus:outline-none"
                      onClick={() => toggleSection(section.id)}
                      aria-label={
                        expandedSections[section.id] ? "Recolher" : "Expandir"
                      }
                    >
                      {expandedSections[section.id] ? "▼" : "▶"}
                    </button>
                    <span className="inline-flex items-center gap-1">
                      <span className="font-medium">{section.name}</span>
                    </span>
                  </td>
                  <td className="px-4 py-2 align-top">
                    <input
                      type="checkbox"
                      className="form-checkbox h-5 w-5 text-blue-600"
                      checked={isSectionSelected(section)}
                      onChange={(e) =>
                        handleSectionCheckbox(section, e.target.checked)
                      }
                    />
                  </td>
                </tr>
                {expandedSections[section.id] &&
                  (
                    itemsBySection[
                      section.data?.slug || section.data?.name || section.name
                    ] || []
                  ).map((item) => (
                    <tr key={item.id} className="border-b bg-gray-50">
                      <td className="px-8 py-2">
                        <span className="inline-flex items-center gap-1">
                          <span>{item.name}</span>
                        </span>
                      </td>
                      <td className="px-4 py-2">
                        <input
                          type="checkbox"
                          className="form-checkbox h-5 w-5 text-blue-600"
                          checked={isItemSelected(item)}
                          onChange={(e) =>
                            handleItemCheckbox(item, section, e.target.checked)
                          }
                        />
                      </td>
                    </tr>
                  ))}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex justify-center gap-4 pt-4">
        <Button
          onClick={onCancel}
          className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white"
        >
          Cancelar
        </Button>
        <Button
          onClick={onConfirmSelection}
          disabled={selectedFiles.length === 0}
          className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white"
        >
          Confirmar Seleção ({selectedFiles.length})
        </Button>
      </div>
    </div>
  );
};

export default FileSelectionInterface;
