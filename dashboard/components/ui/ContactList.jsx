export function ContactList({
  contacts = [],
  selectedContact,
  onContactClick,
}) {
  if (contacts.length === 0) return null;

  return (
    <div className="space-y-1">
      {contacts.map((contact, index) => {
        const isSelected = selectedContact?.name === contact.name;
        return (
          <div
            key={index}
            className={`w-full flex flex-col transition-colors py-2 px-2 rounded-md text-sm cursor-pointer ${
              isSelected
                ? "text-black font-medium"
                : "text-[#6B6B6B] hover:text-black"
            }`}
            onClick={() => onContactClick && onContactClick(contact)}
          >
            <div className="flex items-center space-x-3">
              <div
                className={`w-2 h-2 rounded-full ${
                  isSelected ? "bg-orange-500" : "bg-orange-500 opacity-30"
                }`}
              ></div>
              <span className={isSelected ? "font-medium" : ""}>
                {contact.name}
              </span>
            </div>
            <span className="text-xs text-gray-500 ml-5">
              {contact.jobTitle}
            </span>
          </div>
        );
      })}
    </div>
  );
}
