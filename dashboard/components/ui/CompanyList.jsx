import Image from "next/image";

/**
 * CollectionList - Generic component for rendering a list of collections (companies, books, projects, etc.)
 * @param collections - Array of collections to display
 * @param selectedCollection - Currently selected collection
 * @param onCollectionClick - Callback when collection is clicked
 * @param backgroundColor - Background color for the collection dot indicator
 */
export function CollectionList({
  collections = [],
  selectedCollection,
  onCollectionClick,
  backgroundColor,
}) {
  if (collections.length === 0) return null;

  // Helper para obter nome/título de uma collection
  const getCollectionName = (collection) => {
    return collection?.name || collection?.title || "Unknown";
  };

  return (
    <div className="space-y-1">
      {collections.map((collection, index) => {
        const collectionName = getCollectionName(collection);
        const isSelected =
          getCollectionName(selectedCollection) === collectionName;

        return (
          <div
            key={index}
            onClick={() => onCollectionClick && onCollectionClick(collection)}
            className={`w-full flex items-center space-x-3 transition-colors py-2 px-2 rounded-md text-sm cursor-pointer ${
              isSelected
                ? "text-black font-medium"
                : "text-[#6B6B6B] hover:text-black"
            }`}
          >
            <div
              className={`w-2 h-2 rounded-full ${
                isSelected ? "opacity-100" : "opacity-30"
              }`}
              style={{
                backgroundColor: backgroundColor?.value || "#10b981",
              }}
            ></div>
            <span className={isSelected ? "font-medium" : ""}>
              {collectionName}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ⭐ Backward compatibility: export as CompanyList and EntityList
export const CompanyList = CollectionList;
export const EntityList = CollectionList;
