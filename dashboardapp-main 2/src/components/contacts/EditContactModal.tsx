'use client'

import React, { useState, useEffect } from 'react'
import type { Contact } from '@/types'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { toast } from 'react-hot-toast'
import { db } from '@/lib/firebase'
import { updateDoc, doc, serverTimestamp } from 'firebase/firestore'

interface EditContactModalProps {
  isOpen: boolean
  contact?: Contact | null
  onClose: () => void
}

export function EditContactModal({ isOpen, contact, onClose }: EditContactModalProps) {
  const [isSaving, setIsSaving] = useState(false)
  const [formData, setFormData] = useState({ name: '', jobTitle: '', email: '', linkedinUrl: '' })

  useEffect(() => {
    if (contact) {
      setFormData({
        name: contact.name || '',
        jobTitle: contact.jobTitle || '',
        email: contact.email || '',
        linkedinUrl: contact.linkedinUrl || '',
      })
    }
  }, [contact])

  if (!isOpen || !contact) return null

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) { toast.error('Name is required'); return }
    setIsSaving(true)
    try {
      await updateDoc(doc(db, 'contacts', contact.id), {
        name: formData.name.trim(),
        jobTitle: formData.jobTitle || null,
        email: formData.email || null,
        linkedinUrl: formData.linkedinUrl || null,
        updatedAt: serverTimestamp(),
      })
      toast.success('Contact updated')
      onClose()
    } catch (_) {
      toast.error('Failed to update')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-black dark:bg-opacity-70 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Edit contact</h2>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md">
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <Label htmlFor="name" required>Name</Label>
              <Input id="name" name="name" value={formData.name} onChange={handleChange} className="mt-1" />
            </div>
            <div>
              <Label htmlFor="jobTitle">Job Title</Label>
              <Input id="jobTitle" name="jobTitle" value={formData.jobTitle} onChange={handleChange} className="mt-1" />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} className="mt-1" />
            </div>
            <div>
              <Label htmlFor="linkedinUrl">LinkedIn URL</Label>
              <Input id="linkedinUrl" name="linkedinUrl" type="url" value={formData.linkedinUrl} onChange={handleChange} className="mt-1" />
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
              <Button type="submit" isLoading={isSaving}>Save</Button>
            </div>
          </form>
        </div>
      </Card>
    </div>
  )
}


