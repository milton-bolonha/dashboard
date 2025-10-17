'use client'

import React, { useState, useRef, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeRaw from 'rehype-raw'
import rehypeHighlight from 'rehype-highlight'
import { Tile, Company, Contact, User } from '@/types'
import { Button } from '@/components/ui/Button'
import { 
  PencilIcon, 
  TrashIcon, 
  ArrowPathIcon,
  ChatBubbleLeftRightIcon,
  PaperClipIcon,
  ArrowUpCircleIcon
} from '@heroicons/react/24/outline'
import { db } from '@/lib/firebase'
import { addDoc, collection, deleteDoc, doc, serverTimestamp, updateDoc, onSnapshot, query, orderBy } from 'firebase/firestore'
import { toast } from 'react-hot-toast'
import ReactMemo = React
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'

function LabelLike({ text }: { text: string }) {
  return (
    <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">{text}</div>
  )
}

interface TileComponentProps {
  tile: Tile
  company?: Company
  contact?: Contact
  user: User
  onUpdate: (updates: Partial<Tile>) => void
  onDelete: () => void
  dragHandleProps?: any
  highlightTerm?: string
}

export function TileComponent({
  tile,
  company,
  contact,
  user,
  onUpdate,
  onDelete,
  dragHandleProps,
  highlightTerm = '',
}: TileComponentProps) {
  const [isEditing, setIsEditing] = useState(tile.type === 'note' && !(tile.content && tile.content.length))
  const isNote = tile.type === 'note'
  const [isGenerating, setIsGenerating] = useState(false)
  const [isFlipped, setIsFlipped] = useState(tile.isFlipped)
  const [size, setSize] = useState(tile.size)
  const [editContent, setEditContent] = useState(tile.content || '')
  const [noteTitle, setNoteTitle] = useState<string>(tile.title || 'Note')
  const [noteBody, setNoteBody] = useState<string>(typeof tile.content === 'string' ? tile.content : '')
  const [promptInput, setPromptInput] = useState('')
  const [messages, setMessages] = useState<Array<{ id?: string; prompt: string; response: string; createdAt?: any }>>([])
  const [isHistoryLoading, setIsHistoryLoading] = useState<boolean>(tile.prompt === '__bulk__')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const normalizedHighlight = (highlightTerm || '').trim()
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const highlightHtml = (text: string) => {
    if (!normalizedHighlight) return text
    try {
      const escaped = normalizedHighlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      const re = new RegExp(`(${escaped})`, 'gi')
      return text.replace(re, '<span class="text-red-600 font-bold">$1</span>')
    } catch (_) {
      return text
    }
  }

  const MarkdownContent = ({ content }: { content: string }) => {
    const proseClass = "prose max-w-none dark:prose-invert prose-pre:bg-gray-900 prose-pre:text-gray-100 prose-code:before:content-[''] prose-code:after:content-[''] prose-headings:mt-1 prose-headings:mb-0.5 prose-p:my-0.5 prose-ul:my-0.5 prose-ol:my-0.5 prose-li:my-0 prose-p:font-normal"
    return (
      <div className={proseClass} style={{ fontSize: '12.41px', lineHeight: '1.44', letterSpacing: '-0.01em' }}>
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeRaw, rehypeHighlight]}
          components={{
            pre({ children }) {
              return (
                <div className="relative group">
                  <button
                    type="button"
                    className="absolute top-2 right-2 text-xs px-2 py-1 rounded-md bg-gray-800 text-gray-100 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => {
                      const text = String(children as any)
                      navigator.clipboard?.writeText(text).catch(() => {})
                    }}
                  >
                    Copy
                  </button>
                  <pre className="rounded-lg overflow-x-auto">{children}</pre>
                </div>
              )
            },
          }}
        >
          {highlightHtml(content)}
        </ReactMarkdown>
      </div>
    )
  }

  const tileColors = {
    white: 'border border-gray-300 shadow-sm rounded-2xl',
    orange: 'bg-orange-50 border border-orange-200 shadow-sm rounded-2xl',
    blue: 'bg-blue-50 border border-blue-200 shadow-sm rounded-2xl',
    green: 'bg-green-50 border border-green-200 shadow-sm rounded-2xl',
    purple: 'bg-purple-50 border border-purple-200 shadow-sm rounded-2xl',
    red: 'bg-red-50 border border-red-200 shadow-sm rounded-2xl',
    yellow: 'bg-yellow-50 border border-yellow-200 shadow-sm rounded-2xl',
  }

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus()
      textareaRef.current.select()
    }
  }, [isEditing])

  // Subscribe to chat history for ad-hoc tiles so messages persist across reloads
  useEffect(() => {
    if (!tile.id) return
    try {
      setIsHistoryLoading(true)
      const qy = query(collection(db, 'tiles', tile.id, 'history'), orderBy('createdAt', 'asc'))
      const unsub = onSnapshot(qy, (snap) => {
        const items: any[] = []
        snap.forEach((d) => items.push({ id: d.id, ...(d.data() as any) }))
        setMessages(items as any)
        setIsHistoryLoading(false)
      })
      return () => unsub()
    } catch (_) { setIsHistoryLoading(false) }
  }, [tile.id])

  const handleGenerateContent = async () => {
    if (!company) return
    setIsGenerating(true)
    try {
      const effectivePrompt = promptInput.trim() || tile.prompt || ''
      const scopedPrompt = `Company: ${company.name}. ${effectivePrompt}`
      const resp = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: scopedPrompt, apiKey: process.env.NEXT_PUBLIC_OPENAI_KEY || undefined }),
      })
      const data = await resp.json()
      if (!resp.ok) throw new Error(data?.error || 'Failed to generate')
      const content: string = data.content || ''
      // For chat tiles (__bulk__), create a new tile for the answer instead of filling this input tile
      if (tile.prompt === '__bulk__') {
        const deriveTitle = (q: string) => {
          const cleaned = q.replace(/^\s*what is\s+/i, '').replace(/\s*\?\s*$/, '')
          const firstSentence = cleaned.split(/[.!?]/)[0]
          return firstSentence.length > 60 ? firstSentence.slice(0, 57) + '…' : (firstSentence || 'Answer')
        }
        try {
          // Transform current Ask tile into the answer tile
          const tileDoc = doc(db, 'tiles', tile.id)
          const newTitle = deriveTitle(effectivePrompt)
          await updateDoc(tileDoc, {
            title: newTitle,
            prompt: effectivePrompt,
            content,
            isFlipped: false,
            position: 0,
            updatedAt: serverTimestamp(),
            companyId: company.id,
          })
          onUpdate({ title: newTitle, prompt: effectivePrompt, content, isFlipped: false })
          // Hint to Dashboard to seed a fresh Ask tile and show the last asked prompt
          try { localStorage.setItem(`ask:last:${tile.dashboardId}`, effectivePrompt) } catch (_) {}
        } catch (_) {}
      } else {
        // Normal template tiles update their own content
        onUpdate({ content })
      }
      // For Ask tile we don't keep a chat transcript; for others, store prompt+response
      if (tile.prompt !== '__bulk__') {
        setMessages(prev => [...prev, { prompt: effectivePrompt, response: content, createdAt: new Date() }])
      }

      // Persist tile prompt+answer
      if (tile.prompt !== '__bulk__') {
        try {
          const tileDoc = doc(db, 'tiles', tile.id)
          await updateDoc(tileDoc, {
            content,
            lastPrompt: effectivePrompt,
            updatedAt: serverTimestamp(),
            companyId: company.id,
          })
        } catch (_) {
          // If tile doc does not exist yet, create it
          await addDoc(collection(db, 'tiles'), {
            id: tile.id,
            title: tile.title,
            prompt: tile.prompt,
            content,
            position: tile.position,
            size: tile.size,
            type: tile.type,
            color: tile.color,
            isFlipped: tile.isFlipped,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            userId: user.id,
            dashboardId: tile.dashboardId,
            companyId: company.id,
          })
        }
      }

      // Store conversation history item in subcollection (skip for Ask tile to avoid duplication)
      if (tile.prompt !== '__bulk__') {
        try {
          await addDoc(collection(db, 'tiles', tile.id, 'history'), {
            prompt: effectivePrompt,
            response: content,
            createdAt: serverTimestamp(),
            companyId: company.id,
            userId: user.id,
          })
        } catch (_) {}
      }

      toast.success('Generated!')
      setPromptInput('')
    } catch (e: any) {
      toast.error('Failed to generate')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleRefineContent = () => {
    if (!promptInput.trim() || !tile.content) return

    setIsGenerating(true)
    
    // Mock content refinement
    const refinedContent = `${tile.content}\n\n--- Refined Response ---\n\nBased on your request: "${promptInput}"\n\nHere's an enhanced version of the content with additional insights and details. This mock response simulates what an AI would generate when refining existing content based on user feedback.`
    
    onUpdate({ content: refinedContent })
    setPromptInput('')
    toast.success('Content refined successfully')
    setIsGenerating(false)
  }

  const handleSaveEdit = () => {
    if (isNote) {
      const titleToSave = (noteTitle || '').trim() || 'Note'
      onUpdate({ title: titleToSave, content: noteBody })
    } else {
      onUpdate({ content: editContent })
    }
    setIsEditing(false)
  }

  const handleCancelEdit = () => {
    if (isNote) {
      setNoteTitle(tile.title || 'Note')
      setNoteBody((tile.content as string) || '')
    } else {
      setEditContent(tile.content || '')
    }
    setIsEditing(false)
  }

  const handleFlip = () => {
    const newFlipped = !isFlipped
    setIsFlipped(newFlipped)
    onUpdate({ isFlipped: newFlipped })
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      if (isFlipped) {
        handleRefineContent()
      } else {
        handleSaveEdit()
      }
    }
    if (e.key === 'Escape') {
      if (isFlipped) {
        setPromptInput('')
      } else {
        handleCancelEdit()
      }
    }
  }

  // Resize logic
  const resizeStart = useRef<{ x: number; y: number; w: number; h: number } | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const onPointerDown = (e: React.PointerEvent, corner: 'nw' | 'ne' | 'sw' | 'se') => {
    e.preventDefault()
    const el = containerRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    resizeStart.current = { x: e.clientX, y: e.clientY, w: rect.width, h: rect.height }
    el.style.userSelect = 'none'
    el.style.pointerEvents = 'auto'
    ;(e.target as Element).setPointerCapture?.(e.pointerId)
  }

  const onPointerMove = (e: React.PointerEvent) => {
    if (!resizeStart.current) return
    const dx = e.clientX - resizeStart.current.x
    const dy = e.clientY - resizeStart.current.y
    const w = Math.max(254.57, resizeStart.current.w + dx)
    const h = 218.52 // Fixed height as per design
    if (containerRef.current) {
      containerRef.current.style.width = w + 'px'
      containerRef.current.style.height = h + 'px'
    }
  }

  const onPointerUp = () => {
    if (!resizeStart.current) return
    resizeStart.current = null
    if (containerRef.current) {
      containerRef.current.style.userSelect = ''
    }
    // Snap sizes to buckets to update tile.size for layout semantics
    if (!containerRef.current) return
    const w = containerRef.current.offsetWidth
    const newSize = w < 260 ? 'small' : w < 360 ? 'medium' : w < 520 ? 'large' : 'xlarge'
    setSize(newSize as typeof size)
    onUpdate({ size: newSize as any })
  }

  return (
    <div
      className={`
        relative group transition-all duration-300 ease-out hover:shadow-md
        ${isNote ? 'border border-gray-300 shadow-sm rounded-2xl' : (tile.prompt === '__bulk__' ? 'bg-white border border-gray-200 shadow-sm rounded-xl' : (isFlipped ? 'bg-white border border-gray-200 shadow-sm rounded-xl' : tileColors.white))}
        flex flex-col overflow-hidden min-h-0
      `}
      ref={containerRef}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      style={{
        width: '100%',
        height: '100%',
        backgroundColor: isNote ? '#FAFAFA' : (tile.prompt === '__bulk__' ? undefined : (isFlipped ? undefined : '#FAFAFA')),
      }}
    >
      {/* Resize handles - only show when not dragging for reordering */}
      {!dragHandleProps && (
        <>
          <div className="resize-handle resize-handle-nw cursor-nwse-resize" onPointerDown={(e)=>onPointerDown(e,'nw')} />
          <div className="resize-handle resize-handle-ne cursor-nesw-resize" onPointerDown={(e)=>onPointerDown(e,'ne')} />
          <div className="resize-handle resize-handle-sw cursor-nesw-resize" onPointerDown={(e)=>onPointerDown(e,'sw')} />
          <div className="resize-handle resize-handle-se cursor-nwse-resize" onPointerDown={(e)=>onPointerDown(e,'se')} />
        </>
      )}

      {/* Header (hidden for newly created ad-hoc tiles) */}
      <div 
        className={`px-1 pt-1 pb-0.5 select-text ${isNote ? 'bg-[#D37B11]' : 'bg-white'}`}
      >
        <div className="flex items-center justify-between">
          {isEditing && isNote ? (
            <input
              value={noteTitle}
              onChange={(e) => setNoteTitle(e.target.value)}
              placeholder="Title"
              className="text-white truncate w-full bg-transparent focus:outline-none"
              style={{ 
                fontSize: '14.14px', 
                padding: '2.4px', 
                border: 'none',
                fontFamily: 'SF Pro, -apple-system, BlinkMacSystemFont, system-ui, sans-serif',
                fontWeight: '590',
                lineHeight: '100%',
                letterSpacing: '0%'
              }}
            />
          ) : (
              <div 
                className={`flex items-center ${isNote ? 'cursor-text hover:bg-black hover:bg-opacity-10 rounded px-1 py-0.5 transition-colors' : ''}`}
                onClick={isNote ? () => setIsEditing(true) : undefined}
              >
                {tile.title && (
                  <>
                    {/* Icon identical to the leftmost icon of the three tile icons */}
                    <ChatBubbleLeftRightIcon className={`h-3 w-3 mr-2 flex-shrink-0 ${isNote ? 'text-white' : 'text-gray-700'}`} />
                    <h3 className={`truncate ${isNote ? 'text-white' : 'text-gray-700'}`} style={{ 
                      fontSize: '14.14px',
                      fontFamily: 'SF Pro, -apple-system, BlinkMacSystemFont, system-ui, sans-serif',
                      fontWeight: '590',
                      lineHeight: '100%',
                      letterSpacing: '0%'
                    }}>
                      {tile.title}
                    </h3>
                  </>
                )}
              </div>
          )}
          <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {!isNote && tile.prompt !== '__bulk__' && (
              <Button variant="ghost" size="sm" onClick={handleFlip} className="p-1.5 h-10 w-10">
                <ChatBubbleLeftRightIcon className="h-8 w-8" />
              </Button>
            )}
            {!isNote && (
              <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)} className="p-1.5 h-10 w-10">
                <PencilIcon className="h-8 w-8" />
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={() => setShowDeleteConfirm(true)} className="p-1.5 h-10 w-10 text-red-600 hover:text-red-700">
              <TrashIcon className="h-8 w-8" />
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-3 pt-0 pb-1 flex-1 overflow-hidden min-h-0 select-text">
        {isFlipped ? (
          /* Chat interface for refinements - matching bulk upload tile style */
          <div className="flex-1 flex flex-col min-h-0 items-center justify-center">
            <div className="overflow-y-auto font-normal select-text p-0 bg-transparent border-0" style={{ fontSize: '12.41px', width: '300px', height: '168.22px', lineHeight: '1.44', letterSpacing: '-0.01em', color: '#555554' }}>
              <div className="space-y-4 h-full flex flex-col">
                <div className="bg-gray-50 rounded-lg p-1.5 max-h-32 overflow-y-auto flex-1">
                  <MarkdownContent content={tile.content || ''} />
                </div>
                <div className="relative">
                  <textarea
                    value={promptInput}
                    onChange={(e) => setPromptInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="How would you like to refine this content?"
                    className="w-full pr-12 pl-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-normal resize-none"
                    style={{ fontSize: '12.41px', lineHeight: '1.2', letterSpacing: '-0.01em' }}
                    rows={3}
                  />
                  <div className="absolute inset-y-0 right-2 flex items-end pb-2">
                    <button
                      type="button"
                      onClick={handleRefineContent}
                      disabled={!promptInput.trim() || isGenerating}
                      className="p-1.5 rounded-full text-gray-500 hover:text-gray-700 disabled:opacity-50"
                      aria-label="Refine"
                    >
                      {isGenerating ? (
                        <svg className="animate-spin text-blue-600" style={{ width: '12.5px', height: '12.5px' }} viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                        </svg>
                      ) : (
                        <ArrowUpCircleIcon style={{ width: '12.5px', height: '12.5px' }} />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Main content view: show generated content directly on the tile */
          <div className="h-full flex flex-col min-h-0">
            {isEditing ? (
              <div className="space-y-2 flex-1 flex flex-col">
                {isNote ? (
                  <>
                    <textarea
                      ref={textareaRef}
                      value={noteBody}
                      onChange={(e) => setNoteBody(e.target.value)}
                      onKeyDown={handleKeyDown}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent flex-1 resize-none bg-white font-normal"
                      style={{ fontSize: '12.41px', lineHeight: '1.2', letterSpacing: '-0.01em' }}
                      placeholder="Write your note..."
                    />
                  </>
                ) : (
                  <textarea
                    ref={textareaRef}
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent flex-1 resize-none font-normal"
                    style={{ fontSize: '12.41px', lineHeight: '1.2', letterSpacing: '-0.01em' }}
                  />
                )}
                <div className="flex justify-end space-x-2 pt-2">
                  <Button variant="outline" size="sm" onClick={handleCancelEdit}>Cancel</Button>
                  <Button variant="primary" size="sm" onClick={handleSaveEdit}>Save</Button>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col min-h-0 items-center justify-center">
          <div 
            className={`overflow-y-auto font-normal select-text ${tile.prompt === '__bulk__' ? 'p-0 bg-transparent border-0' : 'px-3 pt-3 pb-1'} ${isNote ? 'cursor-text hover:bg-gray-50 rounded transition-colors' : ''}`}
            style={{ fontSize: '12.41px', width: '300px', height: '168.22px', lineHeight: '1.44', letterSpacing: '-0.01em', backgroundColor: tile.prompt === '__bulk__' ? 'transparent' : '#FAFAFA', color: '#555554' }}
            onClick={isNote ? () => setIsEditing(true) : undefined}
          >
              {tile.prompt === '__bulk__' ? (
               isHistoryLoading ? (
                 <div className="w-full h-full flex items-center justify-center py-10">
                   <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-blue-500"></div>
                 </div>
               ) : (
                 <div className="flex flex-col space-y-3">
                   {messages.map((m, i) => (
                     <div key={i} className="flex flex-col space-y-2">
                       <div className="self-end inline-block bg-gray-100 rounded-2xl px-3 py-1" style={{ color: '#555554' }}>{m.prompt}</div>
                        <MarkdownContent content={m.response} />
                     </div>
                   ))}
                 </div>
               )
            ) : (
              <MarkdownContent content={tile.content || (isNote ? 'Add your note…' : 'No content yet. Enter a prompt below and click Generate.')} />
            )}
          </div>
                {/* Prompt input */}
          {/* Hide input and button for Template 1 tiles; show only for ad-hoc tiles */}
          {tile.prompt === '__bulk__' ? (
            <div className="mt-3">
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  if (promptInput.trim() && !isGenerating) handleGenerateContent()
                }}
              >
                <div className="relative" onClick={(e)=>e.stopPropagation()} onKeyDown={(e)=>{ if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); e.stopPropagation() } }}>
                  <textarea
                    value={promptInput}
                    onChange={(e) => setPromptInput(e.target.value)}
                    onKeyDown={(e) => { e.stopPropagation(); if (e.key === 'Enter') { e.preventDefault(); if (promptInput.trim()) handleGenerateContent() } }}
                    placeholder="Ask..."
                    className="pr-20 pl-1.5 pt-1.5 pb-0.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-400 resize-none font-normal"
                    style={{ width: '239.8px', height: '58.76px', fontSize: '12.41px', lineHeight: '1.2', letterSpacing: '-0.01em' }}
                    disabled={isGenerating}
                  />
                  <div className="absolute inset-y-0 right-2 flex items-end pb-2">
                    <button
                      type="button"
                      className="p-1.5 rounded-md text-gray-500 hover:text-gray-700 disabled:opacity-50"
                      tabIndex={-1}
                      aria-label="Attach"
                      onMouseDown={(e)=>e.stopPropagation()}
                      disabled={isGenerating}
                    >
                      <PaperClipIcon style={{ width: '12.5px', height: '12.5px' }} />
                    </button>
                    <button
                      type="submit"
                      disabled={!promptInput.trim() || isGenerating}
                      className="p-1.5 rounded-full text-gray-500 hover:text-gray-700 disabled:opacity-50"
                      aria-label="Send"
                      onMouseDown={(e)=>e.stopPropagation()}
                    >
                      {isGenerating ? (
                        <svg className="animate-spin text-blue-600" style={{ width: '12.5px', height: '12.5px' }} viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                        </svg>
                      ) : (
                        <ArrowUpCircleIcon style={{ width: '12.5px', height: '12.5px' }} />
                      )}
                    </button>
                  </div>
                  {isGenerating && (
                    <div className="absolute left-0 right-0 bottom-0 h-0.5 overflow-hidden rounded-b-lg">
                      <div className="loading-bar" />
                    </div>
                  )}
                </div>
              </form>
            </div>
          ) : null}
              </div>
            )}
          </div>
        )}
      </div>
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={() => { setShowDeleteConfirm(false); onDelete() }}
        title="Delete tile?"
        description="This tile and its history will be permanently deleted."
        confirmLabel="Delete"
        danger
      />
    </div>
  )
}
