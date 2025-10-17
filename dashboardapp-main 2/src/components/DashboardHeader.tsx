'use client'

import React, { useState } from 'react'
import { Company, Contact, User } from '@/types'
import { Button } from '@/components/ui/Button'
import { OutreachGenerator } from '@/components/OutreachGenerator'
import { 
  Bars3Icon,
  PlusIcon,
  ArrowUpTrayIcon,
  UserCircleIcon,
  ChevronDownIcon,
  EnvelopeIcon
} from '@heroicons/react/24/outline'
import { capitalizeWords } from '@/utils/stringUtils'

interface DashboardHeaderProps {
  company?: Company
  contact?: Contact
  user?: User
  onContactSelect: (contact: Contact) => void
  onBulkUpload: () => void
  onFileUpload: () => void
  onMenuClick: () => void
}

export function DashboardHeader({
  company,
  contact,
  user,
  onContactSelect,
  onBulkUpload,
  onFileUpload,
  onMenuClick,
}: DashboardHeaderProps) {
  const [showContactDropdown, setShowContactDropdown] = useState(false)
  const [showOutreachGenerator, setShowOutreachGenerator] = useState(false)

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Left side */}
          <div className="flex items-center space-x-4">
            <button
              onClick={onMenuClick}
              className="p-2 rounded-md hover:bg-gray-100 lg:hidden"
            >
              <Bars3Icon className="h-6 w-6 text-gray-700" />
            </button>
            
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {company?.name ? capitalizeWords(company.name) : 'Select a Company'}
              </h1>
              <div className="flex items-center space-x-4 mt-1">
                <span className="text-sm text-gray-500">
                  Companies / {company?.name ? capitalizeWords(company.name) : 'Search'}
                </span>
              </div>
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center space-x-2">
            {/* Contact Selector */}
            {company && (
              <div className="relative">
                <button
                  onClick={() => setShowContactDropdown(!showContactDropdown)}
                  className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
                >
                  <UserCircleIcon className="h-5 w-5 text-gray-700" />
                  <span className="text-sm font-medium text-gray-800">
                    {contact?.name || 'Select Contact'}
                  </span>
                  <ChevronDownIcon className="h-4 w-4 text-gray-600" />
                </button>

                {showContactDropdown && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-md shadow-lg border border-gray-200 z-50">
                    <div className="p-2">
                      <div className="px-3 py-2 text-sm text-gray-500 border-b border-gray-100">
                        Select a contact
                      </div>
                      {/* Contact list would be populated here */}
                      <div className="py-2">
                        <button
                          onClick={() => {
                            setShowContactDropdown(false)
                            // Handle contact selection
                          }}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 rounded"
                        >
                          No contacts available
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Action Buttons */}
            {company && contact && user && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => setShowOutreachGenerator(true)}
              >
                <EnvelopeIcon className="h-4 w-4 mr-2" />
                Generate Outreach
              </Button>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={onFileUpload}
            >
              <ArrowUpTrayIcon className="h-4 w-4 mr-2" />
              Upload Files
            </Button>

            <Button
              variant="primary"
              size="sm"
              onClick={onBulkUpload}
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Bulk Upload Prompts
            </Button>

            <Button
              variant="secondary"
              size="sm"
              onClick={() => {/* Handle add notes tile */}}
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Add Notes Tile
            </Button>

            {/* Search */}
            <div className="hidden md:block ml-2">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Q Find on page..."
                  className="w-64 pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Outreach Generator Modal */}
      {user && (
        <OutreachGenerator
          company={company}
          contact={contact}
          user={user}
          isOpen={showOutreachGenerator}
          onClose={() => setShowOutreachGenerator(false)}
        />
      )}
    </header>
  )
}
