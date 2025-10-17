'use client'

import { useTheme } from '@/contexts/ThemeContext'
import { SunIcon, MoonIcon } from '@heroicons/react/24/outline'
import { useEffect, useState } from 'react'

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const baseClasses =
    'p-2 rounded-md border shadow-sm transition-colors bg-white text-gray-700 hover:bg-gray-50 border-gray-200 ' +
    'dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700 dark:border-gray-700'

  if (!mounted) {
    return (
      <button className={baseClasses} aria-label="Theme toggle">
        <SunIcon className="h-6 w-6" />
      </button>
    )
  }

  return (
    <button
      onClick={toggleTheme}
      className={baseClasses}
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      {theme === 'light' ? (
        <MoonIcon className="h-6 w-6" />
      ) : (
        <SunIcon className="h-6 w-6" />
      )}
    </button>
  )
}
