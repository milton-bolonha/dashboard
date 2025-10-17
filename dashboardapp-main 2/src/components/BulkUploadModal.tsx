'use client'

import React, { useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Textarea } from '@/components/ui/Textarea'
import { Label } from '@/components/ui/Label'
import { XMarkIcon, DocumentArrowUpIcon } from '@heroicons/react/24/outline'
import { toast } from 'react-hot-toast'
import type { Tile } from '@/types'

interface BulkUploadModalProps {
  isOpen: boolean
  onClose: () => void
  companyId?: string
  dashboardId?: string
  onSuccess: () => void
  onCreateTiles?: (tiles: Tile[]) => void
}

export function BulkUploadModal({ isOpen, onClose, onSuccess, companyId, dashboardId, onCreateTiles }: BulkUploadModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [prompts, setPrompts] = useState('')
  const [dragActive, setDragActive] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!prompts.trim()) return

    setIsLoading(true)
    
    const promptList = prompts
      .split('\n')
      .map(p => p.trim())
      .filter(p => p.length > 0)

    if (promptList.length === 0) {
      toast.error('Please enter at least one prompt')
      setIsLoading(false)
      return
    }

    // Create tiles in memory and let caller persist them. New tiles should appear first.
    const createdTiles: Tile[] = promptList.map((prompt, index) => ({
      id: `tile-${Date.now()}-${index}`,
      title: `Custom Prompt ${index + 1}`,
      prompt: prompt,
      response: `Mock AI response for: ${prompt}`,
      position: index, // caller will reindex so these go to the beginning
      type: 'prompt',
      color: 'white',
      size: 'medium',
      content: null,
      isFlipped: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      userId: 'user-1',
      companyId: companyId || null,
      dashboardId: dashboardId || 'temp',
    }))
    
    if (onCreateTiles) {
      onCreateTiles(createdTiles)
    }
    toast.success(`${createdTiles.length} tiles created successfully`)
    onSuccess()
    setPrompts('')
    setIsLoading(false)
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0]
      if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
        const reader = new FileReader()
        reader.onload = (event) => {
          setPrompts(event.target?.result as string || '')
        }
        reader.readAsText(file)
      } else {
        toast.error('Please upload a text file')
      }
    }
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
        const reader = new FileReader()
        reader.onload = (event) => {
          setPrompts(event.target?.result as string || '')
        }
        reader.readAsText(file)
      } else {
        toast.error('Please upload a text file')
      }
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-black dark:bg-opacity-70 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              Bulk Upload Prompts
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="prompts">
                Enter prompts (one per line)
              </Label>
              <Textarea
                id="prompts"
                value={prompts}
                onChange={(e) => setPrompts(e.target.value)}
                rows={12}
                placeholder="Enter your prompts here, one per line:&#10;&#10;What is this company's main business model?&#10;Who are their main competitors?&#10;What are their recent funding rounds?&#10;What challenges do they face?&#10;Who are the key decision makers?"
                className="mt-1 font-mono text-sm"
              />
              <p className="mt-2 text-sm text-gray-500">
                Each line will become a separate tile. You can also drag and drop a text file.
              </p>
            </div>

            {/* File Upload Area */}
            <div
              className={`
                border-2 border-dashed rounded-lg p-8 text-center transition-colors
                ${dragActive 
                  ? 'border-blue-400 bg-blue-50' 
                  : 'border-gray-300 hover:border-gray-400'
                }
              `}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <DocumentArrowUpIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">
                Drag and drop a text file here, or click to browse
              </p>
              <input
                type="file"
                accept=".txt"
                onChange={handleFileInput}
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer"
              >
                Choose File
              </label>
            </div>

            <div className="flex justify-end space-x-3">
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
                disabled={!prompts.trim()}
              >
                Create Tiles
              </Button>
            </div>
          </form>
        </div>
      </Card>
    </div>
  )
}
