'use client'

import React, { useState, useMemo } from 'react'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'
import { Tile, Company, Contact, User } from '@/types'
import { TileComponent } from '@/components/TileComponent'
import { AddTileButton } from '@/components/AddTileButton'
import { useDashboard } from '@/hooks/useDashboard'

interface TileGridProps {
  tiles: Tile[]
  company?: Company
  contact?: Contact
  user: User
  isLoading: boolean
  searchQuery?: string
  gridColsClass?: string
}

export function TileGrid({ tiles, company, contact, user, isLoading, searchQuery = '', gridColsClass }: TileGridProps) {
  const { updateTiles, updateTile } = useDashboard()
  const [isDragging, setIsDragging] = useState(false)
  const normalizedQuery = searchQuery.trim().toLowerCase()
  const filteredTiles = useMemo(() => {
    // Filter out note tiles as they are displayed in a separate Notes section
    const nonNoteTiles = tiles.filter(t => t.type !== 'note')
    
    return normalizedQuery
      ? nonNoteTiles.filter(t =>
          (t.title || '').toLowerCase().includes(normalizedQuery) ||
          (t.content || '').toLowerCase().includes(normalizedQuery) ||
          (t.prompt || '').toLowerCase().includes(normalizedQuery)
        )
      : nonNoteTiles
  }, [tiles, normalizedQuery])

  const sortedTiles = useMemo(() => {
    return filteredTiles.sort((a, b) => a.position - b.position || a.createdAt?.toString().localeCompare(b.createdAt?.toString() || '') || 0)
  }, [filteredTiles])

  const handleDragEnd = async (result: any) => {
    console.log('Drag ended:', result)
    setIsDragging(false)
    
    if (!result.destination) {
      console.log('No destination, drag cancelled')
      return
    }

    // Only update if position actually changed
    if (result.source.index === result.destination.index) {
      console.log('No position change')
      return
    }

    const newTiles = Array.from(filteredTiles)
    const sourceIndex = result.source.index
    const destinationIndex = result.destination.index
    
    // Remove the dragged tile from source
    const [draggedTile] = newTiles.splice(sourceIndex, 1)
    
    // Insert the dragged tile at destination (this pushes existing tiles to the right)
    newTiles.splice(destinationIndex, 0, draggedTile)

    // Update positions based on new order
    const updatedTiles = newTiles.map((tile, index) => ({
      ...tile,
      position: index,
    }))

    console.log('Updating tiles with push behavior:', updatedTiles)
    updateTiles(updatedTiles)

    // Update positions in database
    try {
      const { updateDoc, doc, serverTimestamp } = await import('firebase/firestore')
      const { db } = await import('@/lib/firebase')
      await Promise.all(updatedTiles.map(tile => 
        updateDoc(doc(db, 'tiles', tile.id), { 
          position: tile.position, 
          updatedAt: serverTimestamp() 
        })
      ))
    } catch (error) {
      console.error('Error updating tile positions:', error)
    }
  }

  const handleDragStart = (start: any) => {
    console.log('Drag started:', start)
    setIsDragging(true)
  }

  const handleTileUpdate = async (tileId: string, updates: Partial<Tile>) => {
    updateTile(tileId, updates)
    try {
      const { updateDoc, doc, serverTimestamp } = await import('firebase/firestore')
      const { db } = await import('@/lib/firebase')
      await updateDoc(doc(db, 'tiles', tileId), { ...updates, updatedAt: serverTimestamp() })
    } catch (_) {
      // swallow errors to avoid UI disruption; state already updated
    }
  }

  const handleTileDelete = async (tileId: string) => {
    try {
      const { deleteDoc, doc, collection, getDocs } = await import('firebase/firestore')
      const { db } = await import('@/lib/firebase')
      // Delete history subcollection
      const historySnap = await getDocs(collection(db, 'tiles', tileId, 'history'))
      await Promise.all(historySnap.docs.map(d => deleteDoc(d.ref)))
      // Delete tile doc
      await deleteDoc(doc(db, 'tiles', tileId))
    } catch (_) {}
    const newTiles = tiles.filter(tile => tile.id !== tileId)
    updateTiles(newTiles)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Tiles Grid */}
      <DragDropContext 
        onDragEnd={handleDragEnd} 
        onDragStart={handleDragStart}
      >
        <Droppable droppableId="tiles" direction="horizontal" type="tile">
          {(provided, snapshot) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className={`
                w-full
                ${snapshot.isDraggingOver ? 'bg-blue-50' : ''}
                ${isDragging ? 'opacity-75' : ''}
                transition-all duration-300 ease-out
                overflow-x-auto overflow-y-hidden scrollbar-hide
              `}
              style={{
                '--tile-width': '300px',
                '--tile-height': '218.52px',
                width: '100%',
                display: 'flex',
                flexWrap: 'wrap',
                gap: '24px',
              } as React.CSSProperties}
            >
              {/* Dynamic Tiles from Data */}
              {sortedTiles.map((tile, index) => (
                  <Draggable 
                    key={tile.id} 
                    draggableId={tile.id} 
                    index={index}
                    isDragDisabled={false}
                  >
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        className={`
                          ${snapshot.isDragging ? 'shadow-lg transform rotate-2 z-50' : ''}
                          transition-transform duration-200
                          cursor-move
                          select-none
                        `}
                        style={{
                          width: '300px',
                          height: '218.52px',
                          ...provided.draggableProps.style,
                        }}
                        onTouchStart={(e) => {
                          console.log('Touch start on tile:', tile.id)
                        }}
                        onMouseDown={(e) => {
                          console.log('Mouse down on tile:', tile.id)
                        }}
                      >
                        <TileComponent
                          tile={tile}
                          company={company}
                          contact={contact}
                          user={user}
                          highlightTerm={searchQuery}
                          onUpdate={(updates) => handleTileUpdate(tile.id, updates)}
                          onDelete={() => handleTileDelete(tile.id)}
                        />
                      </div>
                    )}
                  </Draggable>
                ))}
              
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      {/* Empty State */}
      {tiles.length === 0 && (
        <div className="text-center py-12">
          <div className="mx-auto h-24 w-24 text-gray-300 mb-4">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No tiles yet
          </h3>
          <p className="text-gray-500 mb-6">
            Add your first tile to start building your dashboard
          </p>
          <AddTileButton
            company={company}
            contact={contact}
            user={user}
            variant="primary"
          />
        </div>
      )}
    </div>
  )
}
