'use client'

import React, { useState, useRef } from 'react'
import { Company, User } from '@/types'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { 
  ArrowUpTrayIcon, 
  DocumentIcon, 
  XMarkIcon,
  PaperClipIcon
} from '@heroicons/react/24/outline'
import { toast } from 'react-hot-toast'

interface FileUploadProps {
  company?: Company
  user: User
  dashboardId?: string
  onFileUploaded?: (file: any) => void
}

export function FileUpload({ company, user, dashboardId, onFileUploaded }: FileUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

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
      handleFiles(e.dataTransfer.files)
    }
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files)
    }
  }

  const handleFiles = async (files: FileList) => {
    setIsUploading(true)
    
    try {
      const uploadPromises = Array.from(files).map(file => uploadFile(file))
      const results = await Promise.all(uploadPromises)
      
      toast.success(`${results.length} file(s) uploaded successfully`)
      
      if (onFileUploaded) {
        results.forEach(file => onFileUploaded(file))
      }
    } catch (error) {
      console.error('Error uploading files:', error)
      toast.error('Failed to upload files')
    } finally {
      setIsUploading(false)
    }
  }

  const uploadFile = async (file: File) => {
    // Signed upload via server route using cloud name, api key, secret on the server
    const form = new FormData()
    form.append('file', file)
    // Optionally pass a folder name
    // form.append('folder', `users/${user.id}/${company?.id || 'general'}`)

    const res = await fetch('/api/uploads/cloudinary', {
      method: 'POST',
      body: form,
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data?.error || 'Upload failed')

    return {
      id: data.asset_id || data.public_id || `file-${Date.now()}`,
      name: data.original_filename || file.name,
      url: data.secure_url,
      type: file.type || data.resource_type,
      size: file.size,
      createdAt: new Date(),
      updatedAt: new Date(),
      userId: user.id,
      companyId: company?.id || '',
      dashboardId: dashboardId || '',
    }
  }

  const openFileDialog = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div
        className={`
          border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer
          ${dragActive 
            ? 'border-blue-400 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400'
          }
          ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}
        `}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={openFileDialog}
      >
        <ArrowUpTrayIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600 mb-2">
          {isUploading ? 'Uploading...' : 'Drag and drop files here, or click to browse'}
        </p>
        <p className="text-sm text-gray-500">
          Supports: PDF, DOC, DOCX, TXT, CSV, images
        </p>
      </div>

      {/* File Input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".pdf,.doc,.docx,.txt,.csv,.jpg,.jpeg,.png,.gif"
        onChange={handleFileInput}
        className="hidden"
      />

      {/* Upload Button */}
      <div className="flex justify-center">
        <Button
          onClick={openFileDialog}
          disabled={isUploading}
          isLoading={isUploading}
          variant="outline"
        >
          <ArrowUpTrayIcon className="h-4 w-4 mr-2" />
          Choose Files
        </Button>
      </div>
    </div>
  )
}

interface FileListProps {
  files: any[]
  onFileDelete?: (fileId: string) => void
}

export function FileList({ files, onFileDelete }: FileListProps) {
  const handleDelete = (fileId: string) => {
    // Mock delete functionality
    console.log('Deleting file:', fileId)
    toast.success('File deleted successfully')
    if (onFileDelete) {
      onFileDelete(fileId)
    }
  }

  const getFileIcon = (type: string) => {
    if (type.includes('pdf')) return '📄'
    if (type.includes('doc')) return '📝'
    if (type.includes('image')) return '🖼️'
    if (type.includes('text')) return '📄'
    return '📎'
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  if (files.length === 0) {
    return (
      <div className="text-center py-8">
        <PaperClipIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500">No files uploaded yet</p>
      </div>
    )
  }

  const isImage = (t: string) => t?.includes('image')

  const copyLink = async (url: string) => {
    try { await navigator.clipboard.writeText(url); toast.success('Link copied') } catch { toast.error('Copy failed') }
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {files.map((file) => (
        <Card key={file.id} className="overflow-hidden">
          <div className="flex">
            <div className="w-28 h-24 flex items-center justify-center bg-gray-50">
              {isImage(file.type) ? (
                <img src={file.url} alt={file.name} className="w-28 h-24 object-cover" />
              ) : (
                <span className="text-3xl">{getFileIcon(file.type)}</span>
              )}
            </div>
            <div className="flex-1 p-3">
              <div className="flex items-center justify-between">
                <p className="font-medium text-gray-900 truncate max-w-[220px]" title={file.name}>{file.name}</p>
                <span className="ml-2 inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-[11px] text-gray-600 uppercase">{file.type?.split('/')[0] || 'file'}</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">{formatFileSize(file.size)} • {new Date(file.createdAt).toLocaleDateString()}</p>
              <div className="mt-3 flex items-center gap-3">
                <a href={file.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 text-sm">View</a>
                <button onClick={() => copyLink(file.url)} className="text-gray-600 hover:text-gray-800 text-sm">Copy link</button>
                <button onClick={() => handleDelete(file.id)} className="text-red-600 hover:text-red-800 text-sm ml-auto">Delete</button>
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}
