'use client'

import React, { useState } from 'react'
import { Contact } from '@/types'
import { db } from '@/lib/firebase'
import { addDoc, collection, serverTimestamp } from 'firebase/firestore'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { toast } from 'react-hot-toast'

interface AddContactModalProps {
  isOpen: boolean
  onClose: () => void
  companyId?: string
  onSuccess: (contact: Contact) => void
}

export function AddContactModal({ isOpen, onClose, onSuccess, companyId }: AddContactModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    jobTitle: '',
    email: '',
    linkedinUrl: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) return

    setIsLoading(true)
    try {
      const ref = await addDoc(collection(db, 'contacts'), {
        name: formData.name,
        jobTitle: formData.jobTitle || null,
        email: formData.email || null,
        linkedinUrl: formData.linkedinUrl || null,
        insights: null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        userId: 'user-1',
        companyId: companyId || null,
      })
      const contact: Contact = {
        id: ref.id,
        name: formData.name,
        jobTitle: formData.jobTitle || null,
        email: formData.email || null,
        linkedinUrl: formData.linkedinUrl || null,
        insights: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        userId: 'user-1',
        companyId: (companyId as any) || null,
      }
      onSuccess(contact)
      toast.success('Contact added')
      setFormData({ name: '', jobTitle: '', email: '', linkedinUrl: '' })
      onClose()
    } catch (e) {
      toast.error('Failed to add contact')
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-black dark:bg-opacity-70 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              Add New Contact
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name" required>
                Full Name
              </Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                placeholder="e.g., John Smith"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="jobTitle">Job Title</Label>
              <Input
                id="jobTitle"
                name="jobTitle"
                value={formData.jobTitle}
                onChange={handleInputChange}
                placeholder="e.g., CEO, Marketing Director"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="john@company.com"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="linkedinUrl">LinkedIn URL</Label>
              <Input
                id="linkedinUrl"
                name="linkedinUrl"
                type="url"
                value={formData.linkedinUrl}
                onChange={handleInputChange}
                placeholder="https://linkedin.com/in/johnsmith"
                className="mt-1"
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                isLoading={isLoading}
                disabled={!formData.name.trim()}
              >
                Add Contact
              </Button>
            </div>
          </form>
        </div>
      </Card>
    </div>
  )
}
