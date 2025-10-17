'use client'

import React, { useState } from 'react'
import { Company, Contact, User } from '@/types'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Textarea } from '@/components/ui/Textarea'
import { Label } from '@/components/ui/Label'
import { 
  EnvelopeIcon, 
  PhoneIcon, 
  ChatBubbleLeftRightIcon,
  DocumentTextIcon,
  ArrowUpTrayIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'
import { toast } from 'react-hot-toast'

interface OutreachGeneratorProps {
  company?: Company
  contact?: Contact
  user: User
  isOpen: boolean
  onClose: () => void
}

const outreachTypes = [
  {
    id: 'email',
    name: 'Email',
    icon: EnvelopeIcon,
    description: 'Professional email outreach',
    color: 'blue'
  },
  {
    id: 'call',
    name: 'Call Script',
    icon: PhoneIcon,
    description: 'Phone call talking points',
    color: 'green'
  },
  {
    id: 'linkedin',
    name: 'LinkedIn DM',
    icon: ChatBubbleLeftRightIcon,
    description: 'LinkedIn direct message',
    color: 'purple'
  }
]

export function OutreachGenerator({ company, contact, user, isOpen, onClose }: OutreachGeneratorProps) {
  const [selectedType, setSelectedType] = useState<string>('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedContent, setGeneratedContent] = useState('')
  const [subject, setSubject] = useState('')
  const [styleReference, setStyleReference] = useState('')
  const [showEditor, setShowEditor] = useState(false)

  const handleGenerate = () => {
    if (!selectedType || !company) return

    setIsGenerating(true)
    
    // Use mock data for outreach generation
    const { mockOutreach } = require('@/lib/mockData')
    const mockContent = mockOutreach.find((item: any) => item.type === selectedType)
    
    if (mockContent) {
      setGeneratedContent(mockContent.content)
      setSubject(mockContent.subject || '')
      setShowEditor(true)
      toast.success('Outreach content generated successfully')
    } else {
      // Fallback content
      const fallbackContent = {
        email: `Hi ${contact?.name || 'there'},\n\nI hope this email finds you well. I came across ${company.name} and was impressed by your recent developments.\n\nI wanted to reach out because I believe our ${user.solution} could help ${company.name} achieve your goals more efficiently.\n\nWould you be open to a brief 15-minute call next week to discuss how we've helped similar companies?\n\nBest regards,\n${user.name}`,
        call: `Opening: "Hi ${contact?.name || 'there'}, this is ${user.name} from ${user.company}. I hope I'm not catching you at a bad time."\n\nValue prop: "I wanted to reach out because I saw ${company.name}'s recent news and thought our ${user.solution} might be relevant to your growth plans."\n\nPain point: "Many ${contact?.jobTitle || 'decision makers'} I work with struggle with scaling their operations while maintaining quality."\n\nSolution: "Our platform has helped similar companies increase efficiency by 40% through automation."\n\nNext steps: "Would you be open to a brief demo next week? I can show you exactly how it works."`,
        linkedin: `Hi ${contact?.name || 'there'}! 👋\n\nI noticed ${company.name}'s recent growth and thought our ${user.solution} might be a great fit for your team.\n\nWe've helped similar companies in ${company.industry} increase their efficiency by 40%.\n\nWould love to share a quick 15-min demo if you're interested!\n\nBest,\n${user.name}`
      }
      
      setGeneratedContent(fallbackContent[selectedType as keyof typeof fallbackContent] || fallbackContent.email)
      setSubject(selectedType === 'email' ? `Partnership Opportunity - ${user.solution} for ${company.name}` : '')
      setShowEditor(true)
      toast.success('Outreach content generated successfully')
    }
    
    setIsGenerating(false)
  }

  const handleSave = () => {
    // Mock save functionality
    console.log('Saving outreach:', {
      type: selectedType,
      content: generatedContent,
      subject: subject || undefined,
      companyId: company?.id,
      contactId: contact?.id,
    })
    toast.success('Outreach saved successfully')
    onClose()
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setStyleReference(e.target?.result as string || '')
        toast.success('Style reference uploaded successfully')
      }
      reader.readAsText(file)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="w-full max-w-6xl bg-white rounded-lg shadow-lg">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              Generate Outreach
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-md"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {!showEditor ? (
            /* Type Selection */
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Select Outreach Type
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {outreachTypes.map((type) => {
                    const Icon = type.icon
                    return (
                      <button
                        key={type.id}
                        onClick={() => setSelectedType(type.id)}
                        className={`p-6 text-left border-2 rounded-lg transition-colors ${
                          selectedType === type.id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center space-x-3 mb-2">
                          <Icon className={`h-8 w-8 text-${type.color}-600`} />
                          <span className="font-semibold text-gray-900">
                            {type.name}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">
                          {type.description}
                        </p>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Style Reference Upload */}
              <div>
                <Label htmlFor="style-reference">
                  Upload Style Reference (Optional)
                </Label>
                <div className="mt-2">
                  <input
                    type="file"
                    id="style-reference"
                    accept=".txt,.doc,.docx"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <label
                    htmlFor="style-reference"
                    className="flex items-center justify-center w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-gray-400"
                  >
                    <ArrowUpTrayIcon className="h-6 w-6 mr-2 text-gray-400" />
                    <span className="text-sm text-gray-600">
                      Upload sample emails/scripts for style adaptation
                    </span>
                  </label>
                </div>
                {styleReference && (
                  <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">
                      Style reference loaded: {styleReference.length} characters
                    </p>
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-3">
                <Button
                  variant="outline"
                  onClick={onClose}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleGenerate}
                  disabled={!selectedType || isGenerating}
                  isLoading={isGenerating}
                >
                  Generate Outreach
                </Button>
              </div>
            </div>
          ) : (
            /* Side-by-side Editor */
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Side - Context */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Context
                </h3>
                
                <Card>
                  <div className="p-4 space-y-4">
                    <div>
                      <h4 className="font-medium text-gray-900">Company</h4>
                      <p className="text-sm text-gray-600">{company?.name}</p>
                      {company?.industry && (
                        <p className="text-xs text-gray-500">Industry: {company.industry}</p>
                      )}
                    </div>
                    
                    {contact && (
                      <div>
                        <h4 className="font-medium text-gray-900">Contact</h4>
                        <p className="text-sm text-gray-600">{contact.name}</p>
                        {contact.jobTitle && (
                          <p className="text-xs text-gray-500">Title: {contact.jobTitle}</p>
                        )}
                      </div>
                    )}
                    
                    <div>
                      <h4 className="font-medium text-gray-900">Your Solution</h4>
                      <p className="text-sm text-gray-600">{user.solution}</p>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Right Side - AI Draft */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  AI Generated Draft
                </h3>
                
                <div className="space-y-4">
                  {selectedType === 'email' && (
                    <div>
                      <Label htmlFor="subject">Subject Line</Label>
                      <input
                        id="subject"
                        type="text"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter subject line..."
                      />
                    </div>
                  )}
                  
                  <div>
                    <Label htmlFor="content">Content</Label>
                    <Textarea
                      id="content"
                      value={generatedContent}
                      onChange={(e) => setGeneratedContent(e.target.value)}
                      rows={12}
                      className="mt-1"
                      placeholder="Generated content will appear here..."
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3">
                  <Button
                    variant="outline"
                    onClick={() => setShowEditor(false)}
                  >
                    Back
                  </Button>
                  <Button
                    onClick={handleSave}
                  >
                    Save Outreach
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
