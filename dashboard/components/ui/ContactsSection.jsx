import { Plus, Linkedin } from "lucide-react";

const ContactItem = ({ name, jobTitle, linkedinUrl, date }) => (
  <div className="bg-white border border-gray-200 rounded-lg p-4">
    <div className="flex items-center justify-between">
      <div className="flex-grow">
        <h4 className="font-medium text-gray-900 text-sm">{name}</h4>
        <p className="text-sm text-gray-600">{jobTitle}</p>
        {linkedinUrl && (
          <a
            href={linkedinUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center mt-1 text-xs text-blue-600 hover:text-blue-700"
          >
            <Linkedin className="w-3 h-3 mr-1" />
            LinkedIn
          </a>
        )}
      </div>
      <span className="text-xs text-gray-400">{date}</span>
    </div>
  </div>
);

export function ContactsSection({ contacts = [], onAddContact }) {
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Contacts</h3>
      <div className="space-y-4">
        <button
          onClick={onAddContact}
          className="w-full border-2 border-dashed border-gray-300 text-gray-500 rounded-lg py-3 flex items-center justify-center hover:bg-gray-50 transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Contact
        </button>

        {contacts.length > 0 ? (
          contacts.map((contact, index) => (
            <ContactItem
              key={index}
              name={contact.name}
              jobTitle={contact.jobTitle}
              linkedinUrl={contact.linkedinUrl}
              date={new Date(contact.added_at).toLocaleDateString()}
            />
          ))
        ) : (
          <div className="text-center py-8 text-gray-500">
            No contacts added yet
          </div>
        )}
      </div>
    </div>
  );
}
