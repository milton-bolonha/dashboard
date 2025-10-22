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
    <div>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Notes</h3>
      <div className="flex flex-wrap gap-4">
        <button
          onClick={onAddNote}
          className="w-64 h-32 border-2 border-dashed border-gray-300 text-gray-500 rounded-lg flex items-center justify-center hover:bg-gray-50 transition-colors flex-shrink-0"
        >
          <div className="text-center">
            <Plus className="w-6 h-6 mx-auto mb-2" />
            <span className="text-sm">New Note</span>
          </div>
        </button>
        {/* Mock Data */}
        <div className="w-64 flex-shrink-0">
          <NoteCard
            title="Call Notes 21/9"
            content="On the phone with the manager for 3 mins. Not the decision maker..."
            date="2 hours ago"
          />
        </div>
        <div className="w-64 flex-shrink-0">
          <NoteCard
            title="Cold Call Notes 10/9"
            content="Initial contact, seemed interested in the analytics part. Follow up next week."
            date="3 days ago"
          />
        </div>
        <div className="w-64 flex-shrink-0">
          <NoteCard
            title="Meeting Notes 15/9"
            content="Discussed pricing and implementation timeline. Very positive response."
            date="1 week ago"
          />
        </div>
        <div className="w-64 flex-shrink-0">
          <NoteCard
            title="Follow-up 12/9"
            content="Sent proposal and waiting for feedback. They mentioned budget approval needed."
            date="2 weeks ago"
          />
        </div>
      </div>
    </div>
  );
}
