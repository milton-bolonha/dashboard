'use client'

import React, { useState } from 'react'
import { Company, Contact, User } from '@/types'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { Textarea } from '@/components/ui/Textarea'
import { 
  PlusIcon,
  DocumentTextIcon,
  CalendarIcon,
  PaperClipIcon,
  ChatBubbleLeftRightIcon
} from '@heroicons/react/24/outline'
import { toast } from 'react-hot-toast'

interface AddTileButtonProps {
  company?: Company
  contact?: Contact
  user: User
  variant?: 'default' | 'primary'
}

const tileTypes = [
  {
    id: 'prompt',
    name: 'AI Prompt',
    description: 'Generate AI-powered insights',
    icon: ChatBubbleLeftRightIcon,
    color: 'white',
  },
  {
    id: 'note',
    name: 'Note',
    description: 'Add your own notes',
    icon: DocumentTextIcon,
    color: 'orange',
  },
  {
    id: 'event',
    name: 'Event',
    description: 'Track important events',
    icon: CalendarIcon,
    color: 'blue',
  },
  {
    id: 'file',
    name: 'File',
    description: 'Attach files and documents',
    icon: PaperClipIcon,
    color: 'green',
  },
]

export function AddTileButton({ company, contact, user, variant = 'default' }: AddTileButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedType, setSelectedType] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    prompt: '',
    content: '',
  })
  const [isLoading, setIsLoading] = useState(false)

  const handleTypeSelect = (typeId: string) => {
    setSelectedType(typeId)
    const type = tileTypes.find(t => t.id === typeId)
    if (type) {
      setFormData(prev => ({
        ...prev,
        title: type.name,
        prompt: type.id === 'prompt' ? 'Provide insights about this company...' : '',
      }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedType || !formData.title) return

    setIsLoading(true)
    try {
      const response = await fetch('/api/tiles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          prompt: selectedType === 'prompt' ? formData.prompt : undefined,
          content: selectedType !== 'prompt' ? formData.content : undefined,
          type: selectedType,
          color: tileTypes.find(t => t.id === selectedType)?.color || 'white',
          companyId: company?.id,
          dashboardId: 'default', // This would be the current dashboard ID
        }),
      })

      if (response.ok) {
        const newTile = await response.json()
        toast.success('Tile added successfully')
        setIsOpen(false)
        setSelectedType(null)
        setFormData({ title: '', prompt: '', content: '' })
        // The parent component should refresh the tiles
        window.location.reload() // Temporary solution
      } else {
        throw new Error('Failed to create tile')
      }
    } catch (error) {
      console.error('Error creating tile:', error)
      toast.error('Failed to create tile')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    setIsOpen(false)
    setSelectedType(null)
    setFormData({ title: '', prompt: '', content: '' })
  }

  if (variant === 'primary') {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="w-full h-32 border-2 border-dashed border-gray-300 hover:border-gray-400 bg-transparent hover:bg-gray-50"
      >
        <div className="text-center">
          <PlusIcon className="h-8 w-8 mx-auto mb-2 text-gray-400" />
          <span className="text-gray-600 font-medium">Add Tile</span>
        </div>
      </Button>
    )
  }

  return (
    <>
      <Card className="h-32 flex items-center justify-center border-2 border-dashed border-gray-300 hover:border-gray-400 cursor-pointer transition-colors">
        <button
          onClick={() => setIsOpen(true)}
          className="text-center"
        >
          <PlusIcon className="h-8 w-8 mx-auto mb-2 text-gray-400" />
          <span className="text-gray-600 font-medium">Add Tile</span>
        </button>
      </Card>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Add New Tile
              </h2>

              {!selectedType ? (
                /* Type Selection */
                <div className="space-y-3">
                  {tileTypes.map((type) => {
                    const Icon = type.icon
                    return (
                      <button
                        key={type.id}
                        onClick={() => handleTypeSelect(type.id)}
                        className="w-full p-4 text-left border border-gray-200 rounded-lg hover:border-gray-300 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center space-x-3">
                          <Icon className="h-6 w-6 text-gray-500" />
                          <div>
                            <div className="font-medium text-gray-900">
                              {type.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {type.description}
                            </div>
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              ) : (
                /* Form */
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="title">Title *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      required
                      className="mt-1"
                    />
                  </div>

                  {selectedType === 'prompt' && (
                    <div>
                      <Label htmlFor="prompt">Prompt *</Label>
                      <Textarea
                        id="prompt"
                        value={formData.prompt}
                        onChange={(e) => setFormData(prev => ({ ...prev, prompt: e.target.value }))}
                        required
                        rows={4}
                        className="mt-1"
                        placeholder="What would you like to know about this company?"
                      />
                    </div>
                  )}

                  {selectedType !== 'prompt' && (
                    <div>
                      <Label htmlFor="content">Content</Label>
                      <Textarea
                        id="content"
                        value={formData.content}
                        onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                        rows={4}
                        className="mt-1"
                        placeholder="Add your content here..."
                      />
                    </div>
                  )}

                  <div className="flex justify-end space-x-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleCancel}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      isLoading={isLoading}
                      disabled={!formData.title || (selectedType === 'prompt' && !formData.prompt)}
                    >
                      Create Tile
                    </Button>
                  </div>
                </form>
              )}
            </div>
          </Card>
        </div>
      )}
    </>
  )
}
