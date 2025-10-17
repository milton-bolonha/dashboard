'use client'

import React, { useMemo, useState } from 'react'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import type { Contact } from '@/types'
import { PencilSquareIcon, TrashIcon } from '@heroicons/react/24/outline'

interface ContactsTableProps {
  contacts: Contact[]
  onAdd: () => void
  onEdit?: (contact: Contact) => void
  onDelete?: (contact: Contact) => void
}

export function ContactsTable({ contacts, onAdd, onEdit, onDelete }: ContactsTableProps) {
  const [query, setQuery] = useState('')
  const [sortState, setSortState] = useState<'none' | 'asc' | 'desc'>('none')
  const normalized = query.trim().toLowerCase()
  const filtered = useMemo(() => {
    if (!normalized) return contacts
    return contacts.filter(c => `${c.name}`.toLowerCase().includes(normalized))
  }, [contacts, normalized])

  const [confirmOpen, setConfirmOpen] = useState(false)
  const [pendingDelete, setPendingDelete] = useState<Contact | null>(null)

  return (
    <div className="bg-white dark:bg-gray-900 p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="relative">
            <svg className="h-5 w-5 text-gray-400 absolute left-3 top-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
            <input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search contacts..." className="pl-9 pr-3 py-2 rounded-md bg-white dark:bg-gray-800 text-sm" style={{ border: 'none' }} />
          </div>
          <button onClick={() => setSortState(prev => prev === 'none' ? 'asc' : prev === 'asc' ? 'desc' : 'none')} className="inline-flex items-center gap-1 px-2 py-2 text-gray-700 hover:text-gray-900 text-sm">
            <span className="inline-flex flex-col leading-none">
              <svg className={`h-3 w-3 ${sortState === 'desc' ? 'text-gray-900' : 'text-gray-500'}`} viewBox="0 0 20 20" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={sortState === 'desc' ? 2.2 : 1.4} d="M6 12l4-4 4 4"/></svg>
              <svg className={`h-3 w-3 -mt-0.5 ${sortState === 'asc' ? 'text-gray-900' : 'text-gray-500'}`} viewBox="0 0 20 20" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={sortState === 'asc' ? 2.2 : 1.4} d="M6 8l4 4 4-4"/></svg>
            </span>
            <span>Sort</span>
          </button>
          <button className="inline-flex items-center gap-1 px-2 py-2 text-gray-700 hover:text-gray-900 text-sm">
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M3 5h18M6 10h12M10 15h4M12 20h0"/></svg>
            <span>Filter</span>
          </button>
        </div>
        <button 
          onClick={onAdd} 
          className="text-white rounded-md font-semibold" 
          style={{ 
            backgroundColor: '#3165DB', 
            fontSize: '14px', 
            fontWeight: '590', 
            width: '120px', 
            height: '27px' 
          }}
        >
          Add Contact
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <tbody>
            {[...filtered]
              .sort((a, b) => sortState === 'none' ? 0 : sortState === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name))
              .map((c, idx) => (
              <tr key={c.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                <td className="py-2 pr-3 font-medium" style={{ color: '#7F7F7F' }}>{c.name}</td>
                <td className="py-2 pr-3" style={{ color: '#7F7F7F' }}>{c.jobTitle || '—'}</td>
                <td className="py-2 pr-3 text-right space-x-2">
                  <button onClick={() => onEdit && onEdit(c)} className="p-1.5 rounded border border-gray-300 text-gray-700 hover:bg-gray-50" title="Edit">
                    <PencilSquareIcon className="h-4 w-4" />
                  </button>
                  <button onClick={() => { setPendingDelete(c); setConfirmOpen(true) }} className="p-1.5 rounded border border-red-300 text-red-700 hover:bg-red-50" title="Delete">
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="py-8 text-center" style={{ color: '#7F7F7F' }}>No contacts found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <ConfirmDialog
        isOpen={confirmOpen}
        title="Delete contact?"
        description={pendingDelete ? `"${pendingDelete.name}" will be permanently deleted. This action cannot be undone.` : undefined}
        confirmLabel="Delete"
        danger
        onConfirm={() => {
          if (pendingDelete && onDelete) onDelete(pendingDelete)
          setConfirmOpen(false)
          setPendingDelete(null)
        }}
        onClose={() => { setConfirmOpen(false); setPendingDelete(null) }}
      />
    </div>
  )
}


