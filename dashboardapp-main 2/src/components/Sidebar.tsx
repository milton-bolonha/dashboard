'use client'

import React, { useState, useEffect } from 'react'
import { Company, Contact } from '@/types'
import { Button } from '@/components/ui/Button'
import { Logo } from '@/components/ui/Logo'
import { 
  PlusIcon, 
  BuildingOfficeIcon, 
  UserGroupIcon,
  XMarkIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline'
import { capitalizeWords } from '@/utils/stringUtils'

interface SidebarProps {
  companies: Company[]
  selectedCompany?: Company
  onCompanySelect: (company: Company) => void
  onAddCompany: () => void
  onAddContact: () => void
  isOpen: boolean
  onClose: () => void
}

export function Sidebar({
  companies,
  selectedCompany,
  onCompanySelect,
  onAddCompany,
  onAddContact,
  isOpen,
  onClose,
}: SidebarProps) {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(false)

  // Load contacts for selected company
  useEffect(() => {
    if (selectedCompany) {
      loadContacts(selectedCompany.id)
    }
  }, [selectedCompany])

  const loadContacts = (companyId: string) => {
    setLoading(true)
    // Use mock data directly
    const { mockContacts } = require('@/lib/mockData')
    setContacts(mockContacts.filter((contact: any) => contact.companyId === companyId))
    setLoading(false)
  }

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={`
          fixed inset-y-0 left-0 z-50 w-80 shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
        style={{ backgroundColor: '#EFEFEF' }}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <Logo variant="small" />
            <h1 className="text-xl font-bold text-gray-900">AI Sales Dashboard</h1>
            <button
              onClick={onClose}
              className="lg:hidden p-2 rounded-md hover:bg-gray-100"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation */}
          <div className="flex-1 overflow-y-auto p-6">
            {/* Companies Section */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                  Companies
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onAddCompany}
                  className="p-1"
                >
                  <PlusIcon className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="space-y-1">
                {companies.map((company) => (
                  <button
                    key={company.id}
                    onClick={() => onCompanySelect(company)}
                    className={`
                      w-full flex items-center justify-between p-3 rounded-lg text-left transition-colors
                      ${selectedCompany?.id === company.id
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : 'text-gray-700 hover:bg-gray-50'
                      }
                    `}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="p-1 rounded" style={{ backgroundColor: '#FFA492' }}>
                        <BuildingOfficeIcon className="h-5 w-5 flex-shrink-0 text-white" />
                      </div>
                      <span className="font-medium truncate">{capitalizeWords(company.name)}</span>
                    </div>
                    <ChevronRightIcon className="h-4 w-4 flex-shrink-0" />
                  </button>
                ))}
                
                {companies.length === 0 && (
                  <div className="text-center py-8">
                    <div className="mx-auto mb-4 p-2 rounded" style={{ backgroundColor: '#FFA492' }}>
                      <BuildingOfficeIcon className="h-12 w-12 text-white" />
                    </div>
                    <p className="text-gray-500 text-sm mb-4">No companies yet</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={onAddCompany}
                    >
                      Add Your First Company
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Contacts Section */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                  Contacts
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onAddContact}
                  className="p-1"
                >
                  <PlusIcon className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="space-y-1">
                {loading ? (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                  </div>
                ) : contacts.length > 0 ? (
                  contacts.map((contact) => (
                    <div
                      key={contact.id}
                      className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50"
                    >
                      <div className="p-1 rounded" style={{ backgroundColor: '#17CCA1' }}>
                        <UserGroupIcon className="h-5 w-5 flex-shrink-0 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {contact.name}
                        </p>
                        {contact.jobTitle && (
                          <p className="text-xs text-gray-500 truncate">
                            {contact.jobTitle}
                          </p>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <div className="mx-auto mb-4 p-2 rounded" style={{ backgroundColor: '#17CCA1' }}>
                      <UserGroupIcon className="h-12 w-12 text-white" />
                    </div>
                    <p className="text-gray-500 text-sm mb-4">No contacts yet</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={onAddContact}
                    >
                      Add Contact
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-gray-200">
            <div className="text-center">
              <p className="text-xs text-gray-500">
                AI Sales Dashboard v1.0
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
