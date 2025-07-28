import React from "react";
import FieldRenderer from "./FieldRenderer";
import FieldRepeater from "./FieldRepeater";
import get from "lodash/get";

const RecursiveFormRenderer = ({
  addons,
  formData,
  handleAddonChange,
  path = [],
  workspaceSlug,
  sectionSlug,
}) => {
  return addons.map((addon) => {
    const currentPath = [...path, addon.name];
    const value = get(formData, currentPath.join(".")); // Use lodash.get with dot notation path

    if (addon.type === "group") {
      return (
        <fieldset
          key={currentPath.join(".")}
          className="mb-6 border border-gray-300 dark:border-gray-600 rounded-lg p-4"
        >
          <legend className="text-lg font-medium text-gray-900 dark:text-white px-2">
            {addon.label}
          </legend>
          <RecursiveFormRenderer
            addons={addon.fields}
            formData={formData}
            handleAddonChange={handleAddonChange}
            path={currentPath}
            workspaceSlug={workspaceSlug}
            sectionSlug={sectionSlug}
          />
        </fieldset>
      );
    }

    if (addon.type === "repeater") {
      return (
        <FieldRepeater
          key={currentPath.join(".")}
          addon={addon}
          value={value}
          onChange={handleAddonChange}
          path={currentPath}
          workspaceSlug={workspaceSlug}
          sectionSlug={sectionSlug}
        />
      );
    }

    return (
      <FieldRenderer
        key={currentPath.join(".")}
        addon={addon}
        value={value}
        onChange={handleAddonChange}
        path={currentPath}
        workspaceSlug={workspaceSlug}
        sectionSlug={sectionSlug}
      />
    );
  });
};

export default RecursiveFormRenderer;
