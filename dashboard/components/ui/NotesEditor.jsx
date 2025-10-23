"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Edit2, Trash2 } from "lucide-react";

/**
 * Editor de notas para uma company específica
 * Mantém o design original com cards laranjinhas
 */
export default function NotesEditor({ companyId, companyName }) {
  const [notes, setNotes] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [newNote, setNewNote] = useState({ title: "", content: "" });
  const [error, setError] = useState("");

  useEffect(() => {
    if (companyId) {
      loadNotes();
    }
  }, [companyId]);

  const loadNotes = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/guest/notes?companyId=${companyId}`);
      const data = await response.json();

      if (data.success) {
        setNotes(data.notes || []);
      } else {
        setError(data.error || "Failed to load notes");
      }
    } catch (error) {
      console.error("❌ Erro ao carregar notas:", error);
      setError("Failed to load notes");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateNote = async () => {
    if (!newNote.title.trim()) {
      setError("Title is required");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/guest/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyId,
          title: newNote.title.trim(),
          content: newNote.content.trim(),
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Recarregar a lista de notas para garantir sincronização
        await loadNotes();
        setNewNote({ title: "", content: "" });
        setIsCreating(false);
      } else {
        setError(data.error || "Failed to create note");
      }
    } catch (error) {
      console.error("❌ Erro ao criar nota:", error);
      setError("Failed to create note");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateNote = async (noteId, updatedData) => {
    setIsLoading(true);
    setError("");

    try {
      // Filtrar apenas campos permitidos pelo schema
      const allowedFields = {
        title: updatedData.title,
        content: updatedData.content,
      };

      const response = await fetch(`/api/guest/notes/${noteId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(allowedFields),
      });

      const data = await response.json();

      if (data.success) {
        // Recarregar a lista de notas para garantir sincronização
        await loadNotes();
        setEditingNote(null);
      } else {
        setError(data.error || "Failed to update note");
      }
    } catch (error) {
      console.error("❌ Erro ao atualizar nota:", error);
      setError("Failed to update note");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteNote = async (noteId) => {
    if (!confirm("Are you sure you want to delete this note?")) {
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await fetch(`/api/guest/notes/${noteId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (data.success) {
        // Recarregar a lista de notas para garantir sincronização
        await loadNotes();
      } else {
        setError(data.error || "Failed to delete note");
      }
    } catch (error) {
      console.error("❌ Erro ao deletar nota:", error);
      setError("Failed to delete note");
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (date) => {
    const now = new Date();
    const noteDate = new Date(date);
    const diffInHours = Math.floor((now - noteDate) / (1000 * 60 * 60));

    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24)
      return `${diffInHours} hour${diffInHours > 1 ? "s" : ""} ago`;

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7)
      return `${diffInDays} day${diffInDays > 1 ? "s" : ""} ago`;

    const diffInWeeks = Math.floor(diffInDays / 7);
    return `${diffInWeeks} week${diffInWeeks > 1 ? "s" : ""} ago`;
  };

  // Handlers com useCallback para evitar re-renders
  const handleEditNote = useCallback((note) => {
    setEditingNote(note);
  }, []);

  const handleCancelEdit = useCallback(() => {
    setEditingNote(null);
    setError("");
  }, []);

  const handleSaveNote = useCallback(async (noteId, updatedData) => {
    // Remover id do updatedData para evitar erro de schema
    const { id, ...dataToSend } = updatedData;
    await handleUpdateNote(noteId, dataToSend);
  }, []);

  const handleDeleteNoteCallback = useCallback(async (noteId) => {
    await handleDeleteNote(noteId);
  }, []);

  if (!companyId) {
    return (
      <div className="p-6 text-center text-gray-500">
        Select a company to view notes
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Notes</h3>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <div className="flex flex-wrap gap-4">
        {/* Add New Note Button */}
        {!isCreating ? (
          <button
            onClick={() => setIsCreating(true)}
            className="w-64 h-32 border-2 border-dashed border-gray-300 text-gray-500 rounded-lg flex items-center justify-center hover:bg-gray-50 transition-colors flex-shrink-0"
          >
            <div className="text-center">
              <Plus className="w-6 h-6 mx-auto mb-2" />
              <span className="text-sm">New Note</span>
            </div>
          </button>
        ) : (
          <div className="w-64 flex-shrink-0">
            <div className="border border-[#E8E8E8] rounded-lg overflow-hidden">
              <div className="bg-[#E87C2A] text-white p-3">
                <input
                  type="text"
                  value={newNote.title}
                  onChange={(e) =>
                    setNewNote({ ...newNote, title: e.target.value })
                  }
                  className="w-full bg-transparent text-white placeholder-white/70 text-sm font-semibold"
                  placeholder="Note title"
                  disabled={isLoading}
                />
              </div>
              <div className="p-4 bg-white">
                <textarea
                  value={newNote.content}
                  onChange={(e) =>
                    setNewNote({ ...newNote, content: e.target.value })
                  }
                  placeholder="Note content"
                  rows={3}
                  className="w-full text-sm text-gray-700 mb-2 resize-none"
                  disabled={isLoading}
                />
                <div className="flex justify-end space-x-2">
                  <button
                    onClick={() => {
                      setNewNote({ title: "", content: "" });
                      setIsCreating(false);
                      setError("");
                    }}
                    className="px-2 py-1 text-xs text-gray-600 hover:bg-gray-100 rounded"
                    disabled={isLoading}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateNote}
                    disabled={isLoading || !newNote.title.trim()}
                    className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                  >
                    {isLoading ? "Creating..." : "Create Note"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Notes List */}
        {isLoading && notes.length === 0 ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          notes.map((note) => (
            <NoteCard
              key={note.id}
              note={note}
              isEditing={editingNote?.id === note.id}
              editingNote={editingNote}
              setEditingNote={setEditingNote}
              isLoading={isLoading}
              onEdit={handleEditNote}
              onDelete={handleDeleteNoteCallback}
              onSave={handleSaveNote}
              onCancel={handleCancelEdit}
              formatDate={formatDate}
            />
          ))
        )}
      </div>
    </div>
  );
}

// Componente separado para evitar re-renders
const NoteCard = ({
  note,
  isEditing,
  editingNote,
  setEditingNote,
  isLoading,
  onEdit,
  onDelete,
  onSave,
  onCancel,
  formatDate,
}) => {
  if (isEditing) {
    return (
      <div className="w-64 flex-shrink-0">
        <div className="border border-[#E8E8E8] rounded-lg overflow-hidden">
          <div className="bg-[#E87C2A] text-white p-3">
            <input
              type="text"
              value={editingNote?.title || ""}
              onChange={(e) =>
                setEditingNote({ ...editingNote, title: e.target.value })
              }
              className="w-full bg-transparent text-white placeholder-white/70 text-sm font-semibold"
              placeholder="Note title"
              disabled={isLoading}
            />
          </div>
          <div className="p-4 bg-white">
            <textarea
              value={editingNote?.content || ""}
              onChange={(e) =>
                setEditingNote({ ...editingNote, content: e.target.value })
              }
              placeholder="Note content"
              rows={3}
              className="w-full text-sm text-gray-700 mb-2 resize-none"
              disabled={isLoading}
            />
            <div className="flex justify-end space-x-2">
              <button
                onClick={onCancel}
                className="px-2 py-1 text-xs text-gray-600 hover:bg-gray-100 rounded"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                onClick={() => onSave(note.id, editingNote)}
                disabled={isLoading || !editingNote?.title?.trim()}
                className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
              >
                {isLoading ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-64 flex-shrink-0">
      <div className="border border-[#E8E8E8] rounded-lg overflow-hidden">
        <div className="bg-[#E87C2A] text-white p-3">
          <div className="flex justify-between items-start">
            <h4 className="font-semibold text-sm">{note.title}</h4>
            <div className="flex space-x-1 ml-2">
              <button
                onClick={() => onEdit(note)}
                className="p-1 text-white/70 hover:text-white hover:bg-white/20 rounded"
                disabled={isLoading}
              >
                <Edit2 className="w-3 h-3" />
              </button>
              <button
                onClick={() => onDelete(note.id)}
                className="p-1 text-white/70 hover:text-white hover:bg-white/20 rounded"
                disabled={isLoading}
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
        <div className="p-4 bg-white">
          <p className="text-sm text-gray-700 mb-2 whitespace-pre-wrap">
            {note.content || "No content"}
          </p>
          <p className="text-xs text-gray-400">{formatDate(note.createdAt)}</p>
        </div>
      </div>
    </div>
  );
};
