'use client'

import React, { createContext, useContext, useReducer, useEffect, useCallback, useMemo } from 'react'
import { DashboardState, Company, Contact, Dashboard, Tile, User } from '@/types'

interface DashboardContextType extends DashboardState {
  setSelectedCompany: (company: Company | undefined) => void
  setSelectedContact: (contact: Contact | undefined) => void
  setSelectedDashboard: (dashboard: Dashboard | undefined) => void
  updateTiles: (tiles: Tile[]) => void
  addTile: (tile: Tile) => void
  updateTile: (tileId: string, updates: Partial<Tile>) => void
  removeTile: (tileId: string) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | undefined) => void
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined)

type DashboardAction =
  | { type: 'SET_SELECTED_COMPANY'; payload: Company | undefined }
  | { type: 'SET_SELECTED_CONTACT'; payload: Contact | undefined }
  | { type: 'SET_SELECTED_DASHBOARD'; payload: Dashboard | undefined }
  | { type: 'UPDATE_TILES'; payload: Tile[] }
  | { type: 'ADD_TILE'; payload: Tile }
  | { type: 'UPDATE_TILE'; payload: { tileId: string; updates: Partial<Tile> } }
  | { type: 'REMOVE_TILE'; payload: string }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | undefined }

function dashboardReducer(state: DashboardState, action: DashboardAction): DashboardState {
  switch (action.type) {
    case 'SET_SELECTED_COMPANY':
      return { ...state, selectedCompany: action.payload }
    case 'SET_SELECTED_CONTACT':
      return { ...state, selectedContact: action.payload }
    case 'SET_SELECTED_DASHBOARD':
      return { ...state, selectedDashboard: action.payload }
    case 'UPDATE_TILES':
      return { ...state, tiles: action.payload }
    case 'ADD_TILE':
      return { ...state, tiles: [...state.tiles, action.payload] }
    case 'UPDATE_TILE':
      return {
        ...state,
        tiles: state.tiles.map(tile =>
          tile.id === action.payload.tileId
            ? { ...tile, ...action.payload.updates }
            : tile
        ),
      }
    case 'REMOVE_TILE':
      return {
        ...state,
        tiles: state.tiles.filter(tile => tile.id !== action.payload),
      }
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload }
    case 'SET_ERROR':
      return { ...state, error: action.payload }
    default:
      return state
  }
}

const initialState: DashboardState = {
  selectedCompany: undefined,
  selectedContact: undefined,
  selectedDashboard: undefined,
  tiles: [],
  isLoading: false,
  error: undefined,
}

export function DashboardProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(dashboardReducer, initialState)

  const setSelectedCompany = useCallback((company: Company | undefined) => {
    dispatch({ type: 'SET_SELECTED_COMPANY', payload: company })
  }, [])

  const setSelectedContact = useCallback((contact: Contact | undefined) => {
    dispatch({ type: 'SET_SELECTED_CONTACT', payload: contact })
  }, [])

  const setSelectedDashboard = useCallback((dashboard: Dashboard | undefined) => {
    dispatch({ type: 'SET_SELECTED_DASHBOARD', payload: dashboard })
  }, [])

  const updateTiles = useCallback((tiles: Tile[]) => {
    dispatch({ type: 'UPDATE_TILES', payload: tiles })
  }, [])

  const addTile = useCallback((tile: Tile) => {
    dispatch({ type: 'ADD_TILE', payload: tile })
  }, [])

  const updateTile = useCallback((tileId: string, updates: Partial<Tile>) => {
    dispatch({ type: 'UPDATE_TILE', payload: { tileId, updates } })
  }, [])

  const removeTile = useCallback((tileId: string) => {
    dispatch({ type: 'REMOVE_TILE', payload: tileId })
  }, [])

  const setLoading = useCallback((loading: boolean) => {
    dispatch({ type: 'SET_LOADING', payload: loading })
  }, [])

  const setError = useCallback((error: string | undefined) => {
    dispatch({ type: 'SET_ERROR', payload: error })
  }, [])

  // Note: Tile updates are streamed by `Dashboard.tsx` via Firestore subscriptions.
  // Avoid syncing tiles here to prevent potential update loops.

  const value: DashboardContextType = useMemo(() => ({
    ...state,
    setSelectedCompany,
    setSelectedContact,
    setSelectedDashboard,
    updateTiles,
    addTile,
    updateTile,
    removeTile,
    setLoading,
    setError,
  }), [state, setSelectedCompany, setSelectedContact, setSelectedDashboard, updateTiles, addTile, updateTile, removeTile, setLoading, setError])

  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  )
}

export function useDashboard() {
  const context = useContext(DashboardContext)
  if (context === undefined) {
    throw new Error('useDashboard must be used within a DashboardProvider')
  }
  return context
}
