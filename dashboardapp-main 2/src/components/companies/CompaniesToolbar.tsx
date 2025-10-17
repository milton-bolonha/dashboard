'use client'

import React from 'react'
import { MagnifyingGlassIcon, PlusIcon } from '@heroicons/react/24/outline'

type SortState = 'none' | 'asc' | 'desc'

interface CompaniesToolbarProps {
  query: string
  onQueryChange: (value: string) => void
  onAdd: () => void
  sortState?: SortState
  onSortCycle?: () => void
}

export function CompaniesToolbar({ query, onQueryChange, onAdd, sortState = 'none', onSortCycle }: CompaniesToolbarProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
      <div className="flex items-center gap-2">
        <div className="relative">
          <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute left-3 top-2.5" />
          <input
            value={query}
            onChange={(e)=> onQueryChange(e.target.value)}
            placeholder="Search"
            className="pl-9 pr-3 py-2 rounded-md bg-white dark:bg-gray-800"
            style={{ fontSize: '16px', border: 'none' }}
          />
        </div>
        {onSortCycle && (
          <button onClick={onSortCycle} className="inline-flex items-center gap-1 px-2 py-2 text-gray-700 hover:text-gray-900" style={{ fontSize: '16px' }}>
            {/* Dual arrow icon with bold state */}
            <span className="inline-flex flex-col leading-none">
              <svg className={`h-3 w-3 ${sortState === 'desc' ? 'text-gray-900' : 'text-gray-500'}`} viewBox="0 0 20 20" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={sortState === 'desc' ? 2.2 : 1.4} d="M6 12l4-4 4 4" />
              </svg>
              <svg className={`h-3 w-3 -mt-0.5 ${sortState === 'asc' ? 'text-gray-900' : 'text-gray-500'}`} viewBox="0 0 20 20" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={sortState === 'asc' ? 2.2 : 1.4} d="M6 8l4 4 4-4" />
              </svg>
            </span>
            <span>Sort</span>
          </button>
        )}
      </div>
      <div className="flex items-center gap-2">
        <button 
          onClick={onAdd} 
          className="inline-flex items-center gap-2 px-3 text-white rounded-md"
          style={{ 
            backgroundColor: '#3165DB', 
            height: '26.97px', 
            fontSize: '16px' 
          }}
        >
          <PlusIcon className="h-4 w-4" />
          Add Company
        </button>
      </div>
    </div>
  )
}


