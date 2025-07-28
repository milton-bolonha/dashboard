import React, { useState } from "react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";

const FileSelectionInterface = ({
  availableFiles,
  selectedFiles,
  onSelectionChange,
}) => {
  const [expandedSections, setExpandedSections] = useState(new Set());

  // Converte a lista plana de arquivos selecionados para um Set de IDs para busca rápida
  const selectedIds = new Set(selectedFiles.map((f) => f.id));

  const toggleSection = (sectionId) => {
    setExpandedSections((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    const allFiles = availableFiles.flatMap(
      (section) => section.children || []
    );
    onSelectionChange(allFiles);
  };

  const handleClearAll = () => {
    onSelectionChange([]);
  };

  const handleFileSelect = (file, isSelected) => {
    let newSelection;
    if (isSelected) {
      newSelection = [...selectedFiles, file];
    } else {
      newSelection = selectedFiles.filter((f) => f.id !== file.id);
    }
    onSelectionChange(newSelection);
  };

  const handleSectionSelect = (section, isSelected) => {
    const sectionFiles = section.children || [];
    let newSelection;
    if (isSelected) {
      // Adicionar apenas arquivos da seção que ainda não estão selecionados
      const filesToAdd = sectionFiles.filter(
        (file) => !selectedIds.has(file.id)
      );
      newSelection = [...selectedFiles, ...filesToAdd];
    } else {
      // Remover todos os arquivos desta seção da seleção
      const sectionFileIds = new Set(sectionFiles.map((f) => f.id));
      newSelection = selectedFiles.filter((f) => !sectionFileIds.has(f.id));
    }
    onSelectionChange(newSelection);
  };

  const isSectionFullySelected = (section) => {
    const childIds = section.children?.map((f) => f.id) || [];
    if (childIds.length === 0) return false;
    return childIds.every((id) => selectedIds.has(id));
  };

  const isSectionPartiallySelected = (section) => {
    const childIds = section.children?.map((f) => f.id) || [];
    if (childIds.length === 0) return false;
    const selectedChildrenCount = childIds.filter((id) =>
      selectedIds.has(id)
    ).length;
    return selectedChildrenCount > 0 && selectedChildrenCount < childIds.length;
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
          Selecionar Arquivos para Importar
        </h2>
        <div className="flex space-x-2">
          <Button onClick={handleSelectAll} variant="outline">
            Selecionar Tudo
          </Button>
          <Button onClick={handleClearAll} variant="ghost">
            Remover Tudo
          </Button>
        </div>
      </div>

      <Card>
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          <div className="p-4 flex bg-gray-50 dark:bg-gray-800 font-semibold">
            <div className="w-2/3">Seção / Arquivo</div>
            <div className="w-1/3 text-center">Selecionar</div>
          </div>
          {availableFiles.map((section) => (
            <div key={section.id}>
              <div className="p-4 flex items-center cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700">
                <div
                  className="w-2/3 flex items-center font-semibold"
                  onClick={() => toggleSection(section.id)}
                >
                  <span
                    className={`transform transition-transform ${
                      expandedSections.has(section.id) ? "rotate-90" : ""
                    }`}
                  >
                    ▶
                  </span>
                  <span className="ml-2">{section.name}</span>
                </div>
                <div className="w-1/3 text-center">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    checked={isSectionFullySelected(section)}
                    ref={(input) => {
                      if (input)
                        input.indeterminate =
                          isSectionPartiallySelected(section);
                    }}
                    onChange={(e) =>
                      handleSectionSelect(section, e.target.checked)
                    }
                  />
                </div>
              </div>
              {expandedSections.has(section.id) && (
                <div className="pl-8">
                  {(section.children || []).map((file) => (
                    <div
                      key={file.id}
                      className="p-3 flex items-center border-t border-gray-200 dark:border-gray-700"
                    >
                      <div className="w-2/3 text-gray-700 dark:text-gray-300">
                        {file.name}
                      </div>
                      <div className="w-1/3 text-center">
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                          checked={selectedIds.has(file.id)}
                          onChange={(e) =>
                            handleFileSelect(file, e.target.checked)
                          }
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default FileSelectionInterface;
