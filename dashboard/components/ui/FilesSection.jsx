import { Plus, FileText } from "lucide-react";

const FileItem = ({ icon, name }) => (
  <div className="flex items-center space-x-3 p-2 rounded-md hover:bg-gray-50">
    {icon}
    <span className="text-sm text-[#333] font-medium">{name}</span>
  </div>
);

export function FilesSection() {
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Files</h3>
      <div className="space-y-2">
        <button className="w-full border-2 border-dashed border-gray-300 text-gray-500 rounded-lg py-3 flex items-center justify-center hover:bg-gray-50 transition-colors">
          <Plus className="w-4 h-4 mr-2" />
          Add New Files
        </button>
        {/* Mock Data */}
        <FileItem
          icon={<FileText className="w-5 h-5 text-gray-400" />}
          name="MEDDPICC Notes.pdf"
        />
        <FileItem
          icon={<FileText className="w-5 h-5 text-gray-400" />}
          name="Call Transcript.docx"
        />
        <FileItem
          icon={<FileText className="w-5 h-5 text-gray-400" />}
          name="Office Locations.csv"
        />
      </div>
    </div>
  );
}
