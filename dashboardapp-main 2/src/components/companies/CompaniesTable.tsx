'use client'

import React, { useMemo, useState } from 'react'
import type { Company } from '@/types'
import { PlusIcon, PencilSquareIcon, TrashIcon } from '@heroicons/react/24/outline'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { CompaniesToolbar } from '@/components/companies/CompaniesToolbar'
import { capitalizeWords } from '@/utils/stringUtils'

interface CompaniesTableProps {
  companies: Company[]
  onAdd: () => void
  onEdit: (company: Company) => void
  onDelete: (company: Company) => Promise<void>
  onSelect?: (company: Company) => void
}

// Helper function to get score background color
const getScoreColor = (score: number): string => {
  switch (score) {
    case 1:
    case 2:
      return '#F77969'; // Red/coral for scores 1-2
    case 3:
      return '#E8D20A'; // Yellow for score 3
    case 4:
    case 5:
      return '#0FB22A'; // Green for scores 4-5
    default:
      return '#F77969'; // Default to red for invalid scores
  }
};

export function CompaniesTable({ companies, onAdd, onEdit, onDelete, onSelect }: CompaniesTableProps) {
  const [query, setQuery] = useState('')
  const [busyId, setBusyId] = useState<string | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [pendingDelete, setPendingDelete] = useState<Company | null>(null)
  const [sortState, setSortState] = useState<'none' | 'asc' | 'desc'>('none')

  const normalizedQuery = query.trim().toLowerCase()
  const filtered = useMemo(() => {
    const base = companies.filter(c => {
      if (!normalizedQuery) return true
      const blob = `${c.name} ${c.url ?? ''} ${c.description ?? ''}`.toLowerCase()
      return blob.includes(normalizedQuery)
    })
    // Preserve insertion order by default (as given). We'll sort in render based on sortState
    return base
  }, [companies, normalizedQuery])

  const computeScore = (c: Company): number => {
    // Use the stored score from database
    if (typeof c.score === 'number' && c.score > 0) {
      return Math.max(1, Math.min(5, Math.floor(c.score)))
    }
    
    // Fallback to deterministic score if no score is stored
    let sum = 0
    for (let i = 0; i < c.name.length; i++) sum = (sum + c.name.charCodeAt(i)) % 97
    return (sum % 5) + 1
  }

  return (
    <div className="bg-white dark:bg-gray-900 p-4">
      <CompaniesToolbar
        query={query}
        onQueryChange={(v)=>{ setQuery(v) }}
        onAdd={onAdd}
        sortState={sortState}
        onSortCycle={() => {
          setSortState(prev => prev === 'none' ? 'asc' : prev === 'asc' ? 'desc' : 'none')
        }}
      />

      <div className="overflow-auto" style={{ maxHeight: '500px' }}>
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700" style={{ fontSize: '16px' }}>
              <th className="py-2 pr-3">
                <div className="flex items-center gap-2">
                  <svg className="h-4 w-4" style={{color: '#FFA492'}} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M4 20V6a2 2 0 012-2h7a2 2 0 012 2v14"/><path d="M4 20h13M8 9h2M8 12h2M8 15h2M12 9h2M12 12h2M12 15h2"/></svg>
                  <span>Companies</span>
                </div>
              </th>
              <th className="py-2 pr-3">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-0.5">
                    <svg className="h-4 w-4 text-amber-500" viewBox="0 0 20 20" fill="currentColor"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118L10 13.347l-2.987 2.134c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L3.38 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
                    <svg className="h-4 w-4 text-amber-500" viewBox="0 0 20 20" fill="currentColor"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118L10 13.347l-2.987 2.134c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L3.38 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
                    <svg className="h-4 w-4 text-amber-500" viewBox="0 0 20 20" fill="currentColor"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118L10 13.347l-2.987 2.134c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L3.38 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
                  </span>
                  <span>Score</span>
                </div>
              </th>
              <th className="py-2 pr-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {[...filtered]
              .sort((a,b)=> sortState === 'none' ? 0 : sortState === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name))
              .map((c, idx) => (
              <tr 
                key={c.id} 
                className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer"
                onClick={() => onSelect?.(c)}
              >
                <td className="py-2 pr-3 font-semibold text-gray-900 dark:text-gray-100 text-lg">{capitalizeWords(c.name)}</td>
                <td className="py-2 pr-3">
                  <span className="inline-flex items-center gap-2 text-sm font-medium">
                    <span 
                      className="inline-flex items-center justify-center w-6 h-6 rounded-full text-white text-xs font-bold"
                      style={{ backgroundColor: getScoreColor(computeScore(c)) }}
                    >
                      {computeScore(c)}
                    </span>
                  </span>
                </td>
                <td className="py-2 pr-3">
                  <div className="flex items-center justify-end gap-2">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        onEdit(c);
                      }} 
                      className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700" 
                      title="Edit"
                    >
                      <PencilSquareIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setPendingDelete(c);
                        setConfirmOpen(true);
                      }}
                      className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-red-600"
                      title="Delete"
                      disabled={busyId === c.id}
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={3} className="py-8 text-center text-gray-500">No companies found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <ConfirmDialog
        isOpen={confirmOpen}
        title="Delete company?"
        description={pendingDelete ? (<span>"{pendingDelete.name}" will be permanently deleted. This action cannot be undone.</span>) : undefined}
        confirmLabel="Delete"
        danger
        onConfirm={async ()=>{
          if (!pendingDelete) return
          if (busyId) return
          setBusyId(pendingDelete.id)
          await onDelete(pendingDelete)
          setBusyId(null)
          setConfirmOpen(false)
          setPendingDelete(null)
        }}
        onClose={()=>{ setConfirmOpen(false); setPendingDelete(null) }}
      />

    </div>
  )
}


