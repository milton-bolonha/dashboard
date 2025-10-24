import Image from "next/image";

export function CompanyList({
  companies = [],
  selectedCompany,
  onCompanyClick,
  backgroundColor,
}) {
  if (companies.length === 0) return null;

  return (
    <div className="space-y-1">
      {companies.map((company, index) => {
        const isSelected = selectedCompany?.name === company.name;
        return (
          <div
            key={index}
            onClick={() => onCompanyClick && onCompanyClick(company)}
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
                backgroundColor: backgroundColor?.value || "#10b981"
              }}
            ></div>
            <span className={isSelected ? "font-medium" : ""}>
              {company.name}
            </span>
          </div>
        );
      })}
    </div>
  );
}
