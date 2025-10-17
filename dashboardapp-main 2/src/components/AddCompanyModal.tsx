'use client'

import React, { useState } from 'react'
import { Company } from '@/types'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { Textarea } from '@/components/ui/Textarea'
import { XMarkIcon, DocumentArrowUpIcon } from '@heroicons/react/24/outline'
import { toast } from 'react-hot-toast'
import { db } from '@/lib/firebase'
import { addDoc, collection, serverTimestamp } from 'firebase/firestore'
import { useAuth } from '@/contexts/AuthContext'
import { capitalizeWords } from '@/utils/stringUtils'

interface AddCompanyModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (company: Company) => void
  variant?: 'quick' | 'full'
}

export function AddCompanyModal({ isOpen, onClose, onSuccess, variant = 'full' }: AddCompanyModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [uploadMode, setUploadMode] = useState<'manual' | 'csv'>('manual')
  const [csvFile, setCsvFile] = useState<File | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    description: '',
    industry: '',
    size: '',
    location: '',
  })
  const { user } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (uploadMode === 'csv') {
      await handleCsvUpload()
    } else {
      await handleManualSubmit()
    }
  }

  const generateAIScore = async (companyData: any): Promise<number> => {
    try {
      const response = await fetch('/api/ai/score-company', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ company: companyData }),
      })

      if (!response.ok) {
        throw new Error('Failed to generate AI score')
      }

      const data = await response.json()
      return data.score
    } catch (error) {
      console.error('Error generating AI score:', error)
      // Fallback to deterministic score
      let sum = 0
      for (let i = 0; i < companyData.name.length; i++) sum = (sum + companyData.name.charCodeAt(i)) % 97
      return (sum % 5) + 1
    }
  }

  const handleManualSubmit = async () => {
    if (!formData.name.trim()) return
    if (!user) {
      toast.error('Please sign in to add a company')
      return
    }

    setIsLoading(true)
    try {
      // Generate AI score before creating the company
      const companyData = {
        name: capitalizeWords(formData.name),
        url: formData.url || null,
        description: formData.description || null,
        industry: formData.industry || null,
        size: formData.size || null,
        location: formData.location || null,
      }
      
      const aiScore = await generateAIScore(companyData)
      
      const docRef = await addDoc(collection(db, 'companies'), {
        ...companyData,
        score: aiScore,
        userId: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })

      const newCompany: Company = {
        id: docRef.id,
        name: capitalizeWords(formData.name),
        url: formData.url || null as any,
        description: formData.description || null as any,
        industry: formData.industry || null as any,
        size: formData.size || null as any,
        location: formData.location || null as any,
        score: aiScore,
        createdAt: new Date(),
        updatedAt: new Date(),
        userId: user.uid,
      }

      onSuccess(newCompany)
      setFormData({ name: '', url: '', description: '', industry: '', size: '', location: '' })
      onClose()
    } catch (e) {
      toast.error('Failed to add company')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCsvUpload = async () => {
    if (!csvFile) return

    setIsLoading(true)
    
    try {
      // Mock CSV upload - create mock companies
      const mockCompanies = [
        {
          name: capitalizeWords('CSV Company 1'),
          url: 'https://csvcompany1.com',
          industry: 'Technology',
          size: '50-200 employees',
          location: 'San Francisco, CA',
        },
        {
          name: capitalizeWords('CSV Company 2'),
          url: 'https://csvcompany2.com',
          industry: 'Manufacturing',
          size: '200-500 employees',
          location: 'Chicago, IL',
        }
      ]
      
      // Generate scores and create companies in database
      const createdCompanies = []
      for (const companyData of mockCompanies) {
        const aiScore = await generateAIScore(companyData)
        
        const docRef = await addDoc(collection(db, 'companies'), {
          ...companyData,
          score: aiScore,
          description: null,
          userId: user?.uid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        })
        
        createdCompanies.push({
          id: docRef.id,
          ...companyData,
          score: aiScore,
          description: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          userId: user?.uid || '',
        })
      }
      
      toast.success(`${createdCompanies.length} companies uploaded successfully`)
      onSuccess(createdCompanies[0]) // Return first company for immediate use
      setCsvFile(null)
    } catch (error) {
      console.error('Error uploading CSV:', error)
      toast.error('Failed to upload companies')
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-black dark:bg-opacity-70 flex items-center justify-center z-50 p-2 sm:p-4">
      <Card className="w-full max-w-sm sm:max-w-md md:max-w-lg max-h-[90vh] overflow-hidden" style={{ backgroundColor: '#C6C6C6' }}>
        <div className="p-4 sm:p-6 max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h2 className="text-lg sm:text-xl font-semibold" style={{ color: '#7F7F7F' }}>
              {variant === 'quick' ? 'Add Company' : 'Add New Company'}
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
            >
              <XMarkIcon className="h-5 w-5" style={{ color: '#7F7F7F' }} />
            </button>
          </div>

          {/* Upload Mode Selection (hidden in quick variant) */}
          {variant !== 'quick' && (
            <div className="mb-4 sm:mb-6">
              <div className="flex space-x-2 sm:space-x-4">
                <button
                  type="button"
                  onClick={() => setUploadMode('manual')}
                  className={`px-4 py-2 rounded-md font-medium transition-colors ${
                    uploadMode === 'manual'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  Manual Entry
                </button>
                <button
                  type="button"
                  onClick={() => setUploadMode('csv')}
                  className={`px-4 py-2 rounded-md font-medium transition-colors ${
                    uploadMode === 'csv'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  CSV Upload
                </button>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
            {(variant === 'quick' ? true : uploadMode === 'manual') ? (
              <>
                <div>
                  <Label htmlFor="name" required style={{ color: '#7F7F7F' }}>
                    {variant === 'quick' ? 'I want to research' : 'Company Name'}
                  </Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                placeholder={variant === 'quick' ? 'Apple' : 'e.g., Acme Corporation'}
                className="mt-1"
              />
              {variant === 'quick' && (
                <p className="mt-1 text-xs italic" style={{ color: '#7F7F7F' }}>Type the name of the company you want to research</p>
              )}
            </div>

            <div>
              <Label htmlFor="url" style={{ color: '#7F7F7F' }}>URL (optional)</Label>
              <Input
                id="url"
                name="url"
                type="url"
                value={formData.url}
                onChange={handleInputChange}
                placeholder={variant === 'quick' ? '' : 'https://www.acme.com'}
                className="mt-1"
              />
            </div>

            {variant !== 'quick' && (
            <div>
              <Label htmlFor="description" style={{ color: '#7F7F7F' }}>Description</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={2}
                placeholder="Brief description of the company..."
                className="mt-1"
              />
            </div>
            )}

            {variant !== 'quick' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <Label htmlFor="industry" style={{ color: '#7F7F7F' }}>Industry</Label>
                <Input
                  id="industry"
                  name="industry"
                  value={formData.industry}
                  onChange={handleInputChange}
                  placeholder="e.g., Technology, Healthcare"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="size" style={{ color: '#7F7F7F' }}>Company Size</Label>
                <select
                  id="size"
                  name="size"
                  value={formData.size}
                  onChange={(e) => setFormData(prev => ({ ...prev, size: e.target.value }))}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select size</option>
                  <option value="1-10">1-10 employees</option>
                  <option value="11-50">11-50 employees</option>
                  <option value="51-200">51-200 employees</option>
                  <option value="201-500">201-500 employees</option>
                  <option value="501-1000">501-1000 employees</option>
                  <option value="1000+">1000+ employees</option>
                </select>
              </div>
            </div>
            )}

            {variant !== 'quick' && (
            <div>
              <Label htmlFor="location" style={{ color: '#7F7F7F' }}>Location</Label>
              <Input
                id="location"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                placeholder="e.g., San Francisco, CA"
                className="mt-1"
              />
            </div>
            )}

                <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onClose}
                    className="w-full sm:w-auto"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    isLoading={isLoading}
                    disabled={!formData.name.trim()}
                    className="w-full sm:w-auto"
                  >
                    Add Company
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div>
                  <Label htmlFor="csv-file" required style={{ color: '#7F7F7F' }}>
                    CSV File
                  </Label>
                  <div className="mt-2">
                    <input
                      type="file"
                      id="csv-file"
                      accept=".csv"
                      onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                  </div>
                  <p className="mt-2 text-sm text-gray-500">
                    CSV should have columns: name, url, description, industry, size, location
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onClose}
                    className="w-full sm:w-auto"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    isLoading={isLoading}
                    disabled={!csvFile}
                    className="w-full sm:w-auto"
                  >
                    Upload Companies
                  </Button>
                </div>
              </>
            )}
          </form>
        </div>
      </Card>
    </div>
  )
}
