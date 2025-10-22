import { Plus } from "lucide-react";

const NoteCard = ({ title, content, date }) => (
  <div className="border border-[#E8E8E8] rounded-lg overflow-hidden">
    <div className="bg-[#E87C2A] text-white p-3">
      <h4 className="font-semibold text-sm">{title}</h4>
    </div>
    <div className="p-4 bg-white">
      <p className="text-sm text-gray-700 mb-2">{content}</p>
      <p className="text-xs text-gray-400">{date}</p>
    </div>
  </div>
);

export function NotesSection({ onAddNote }) {
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Notes</h3>
      <div className="space-y-4">
        <button
          onClick={onAddNote}
          className="w-full border-2 border-dashed border-gray-300 text-gray-500 rounded-lg py-3 flex items-center justify-center hover:bg-gray-50 transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Note
        </button>
        {/* Mock Data */}
        <NoteCard
          title="Call Notes 21/9"
          content="On the phone with the manager for 3 mins. Not the decision maker..."
          date="2 hours ago"
        />
        <NoteCard
          title="Cold Call Notes 10/9"
          content="Initial contact, seemed interested in the analytics part. Follow up next week."
          date="3 days ago"
        />
      </div>
    </div>
  );
}
