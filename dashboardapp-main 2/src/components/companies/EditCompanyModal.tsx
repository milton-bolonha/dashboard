'use client'

import React, { useEffect, useState } from 'react'
import type { Company } from '@/types'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'

interface EditCompanyModalProps {
  isOpen: boolean
  company?: Company | null
  onClose: () => void
  onSave: (updates: Partial<Company>) => Promise<void>
}

export function EditCompanyModal({ isOpen, company, onClose, onSave }: EditCompanyModalProps) {
  const [form, setForm] = useState<Partial<Company>>({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setForm(company || {})
  }, [company])

  if (!isOpen || !company) return null

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit company" size="sm">
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
          <Input value={form.name as any || ''} onChange={(e)=> setForm(prev=>({...prev, name: e.target.value}))} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Homepage URL</label>
          <Input value={(form.url as any) || ''} onChange={(e)=> setForm(prev=>({...prev, url: e.target.value}))} />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50">Cancel</button>
          <button
            onClick={async ()=>{ setSaving(true); await onSave({ name: form.name, url: form.url as any }); setSaving(false) }}
            className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
            disabled={saving}
          >
            Save
          </button>
        </div>
      </div>
    </Modal>
  )
}


