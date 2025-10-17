'use client'

import React, { useEffect, useRef, useState } from 'react'

interface UserMenuProps {
  userName?: string | null
  userEmail?: string | null
  onProfile: () => void
  onSignOut: () => Promise<void> | void
}

export function UserMenu({ userName, userEmail, onProfile, onSignOut }: UserMenuProps) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!open) return
      const target = e.target as Element
      const root = rootRef.current
      if (root && !root.contains(target)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDocClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div className="relative" ref={rootRef}>
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-white dark:hover:bg-gray-600 hover:shadow-sm transition-all duration-200 border border-transparent hover:border-gray-200 dark:hover:border-gray-600"
      >
        <div className="p-1 bg-blue-100 rounded-full">
          <svg className="h-4 w-4 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
        <div className="flex-1 flex flex-col text-left">
          <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{userName || 'User'}</span>
          <span className="text-xs text-gray-500 dark:text-gray-400 truncate">{userEmail || 'user@example.com'}</span>
        </div>
        <svg className={`h-4 w-4 text-gray-500 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 bottom-full mb-2 w-56 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50">
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{userName || 'User'}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{userEmail || 'user@example.com'}</p>
          </div>
          <div className="p-1">
            <button
              onClick={() => { setOpen(false); onProfile() }}
              className="w-full text-left px-3 py-2 rounded-md text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200"
            >
              Profile
            </button>
            <button
              onClick={async () => { setOpen(false); await onSignOut() }}
              className="w-full text-left px-3 py-2 rounded-md text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-red-600"
            >
              Logout
            </button>
          </div>
        </div>
      )}
    </div>
  )
}


