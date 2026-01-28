'use client'

import { useEffect, useRef, useState } from 'react'
import '@archilogic/floor-plan-sdk/dist/style.css'
import { deskApi } from '@/app/lib/api'

interface Desk {
  id: string
  position: [number, number]
  name: string
  description: string
  isBlocked: boolean
}

interface TooltipState {
  visible: boolean
  deskId: string | null
  x: number
  y: number
}

export default function ManageSeatPage() {
  const containerRef = useRef<HTMLDivElement>(null)
  const floorPlanRef = useRef<any>(null)
  const [desks, setDesks] = useState<Desk[]>([])
  const [tooltip, setTooltip] = useState<TooltipState>({
    visible: false,
    deskId: null,
    x: 0,
    y: 0,
  })
  const [editingDeskId, setEditingDeskId] = useState<string | null>(null)
  const [editingDeskName, setEditingDeskName] = useState('')
  const [editingDeskDescription, setEditingDeskDescription] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Initialize Floor Plan SDK
  useEffect(() => {
    const initFloorPlan = async () => {
      try {
        // Dynamic import to avoid SSR issues
        const { FloorPlanEngine } = await import('@archilogic/floor-plan-sdk')

        if (!containerRef.current) return

        const floorPlan = new FloorPlanEngine({
          container: containerRef.current,
        })

        floorPlanRef.current = floorPlan

        // Mock floor data - you can replace with actual floor ID and token
        // For now, we'll just set up the SDK without loading a real floor
        // to allow users to interact with the seat plan image
        
        // Initialize with sample desks
        const initialDesks: Desk[] = [
          { id: 'desk-1', position: [2, 2], name: 'Desk 1', description: 'Corner desk near window', isBlocked: false },
          { id: 'desk-2', position: [4, 2], name: 'Desk 2', description: 'Standard desk', isBlocked: false },
          { id: 'desk-3', position: [6, 2], name: 'Desk 3', description: 'Standing desk', isBlocked: false },
          { id: 'desk-4', position: [2, 4], name: 'Desk 4', description: 'Standard desk with monitor', isBlocked: false },
          { id: 'desk-5', position: [4, 4], name: 'Desk 5', description: 'Meeting desk', isBlocked: true },
        ]

        setDesks(initialDesks)

        // Add HTML markers for each desk
        initialDesks.forEach((desk) => {
          const markerEl = document.createElement('div')
          markerEl.classList.add('desk-marker')
          markerEl.style.width = '40px'
          markerEl.style.height = '40px'
          markerEl.style.backgroundColor = desk.isBlocked ? '#ef4444' : '#10b981'
          markerEl.style.borderRadius = '50%'
          markerEl.style.display = 'flex'
          markerEl.style.alignItems = 'center'
          markerEl.style.justifyContent = 'center'
          markerEl.style.color = 'white'
          markerEl.style.fontWeight = 'bold'
          markerEl.style.cursor = 'pointer'
          markerEl.style.fontSize = '12px'
          markerEl.textContent = desk.name.split(' ')[1]

          markerEl.addEventListener('click', (e) => {
            e.stopPropagation()
            const rect = markerEl.getBoundingClientRect()
            setTooltip({
              visible: true,
              deskId: desk.id,
              x: rect.left,
              y: rect.bottom,
            })
          })

          floorPlan.addHtmlMarker({
            position: desk.position,
            el: markerEl,
          })
        })

        // Close tooltip when clicking on floor plan
        floorPlan.on('click', () => {
          setTooltip({ ...tooltip, visible: false })
        })
      } catch (error) {
        console.error('Failed to initialize Floor Plan SDK:', error)
      }
    }

    initFloorPlan()
  }, [])

  const handleEditDesk = (deskId: string) => {
    const desk = desks.find((d) => d.id === deskId)
    if (desk) {
      setEditingDeskId(deskId)
      setEditingDeskName(desk.name)
      setEditingDeskDescription(desk.description)
    }
  }

  const handleSaveDesk = async () => {
    if (editingDeskId) {
      setIsLoading(true)
      setError(null)
      
      const response = await deskApi.updateDesk({
        id: editingDeskId,
        name: editingDeskName,
        description: editingDeskDescription,
      })

      if (response.success) {
        setDesks(
          desks.map((d) =>
            d.id === editingDeskId ? { ...d, name: editingDeskName, description: editingDeskDescription } : d
          )
        )
        setEditingDeskId(null)
        setEditingDeskName('')
        setEditingDeskDescription('')
        setTooltip({ ...tooltip, visible: false })
      } else {
        setError(response.error || 'Failed to update desk')
      }
      
      setIsLoading(false)
    }
  }

  const handleToggleBlock = async (deskId: string) => {
    setIsLoading(true)
    setError(null)
    
    const desk = desks.find((d) => d.id === deskId)
    if (!desk) {
      setIsLoading(false)
      return
    }

    const response = await deskApi.toggleDeskBlock({
      id: deskId,
      isBlocked: !desk.isBlocked,
    })

    if (response.success) {
      setDesks(
        desks.map((d) =>
          d.id === deskId ? { ...d, isBlocked: !d.isBlocked } : d
        )
      )
      setTooltip({ ...tooltip, visible: false })
    } else {
      setError(response.error || 'Failed to toggle desk block status')
    }
    
    setIsLoading(false)
  }

  const selectedDesk = desks.find((d) => d.id === tooltip.deskId)

  return (
    <div className="h-screen w-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-6">
        <h1 className="text-3xl font-bold text-gray-900">Manage Seats</h1>
        <p className="text-gray-600 mt-2">
          Click on desk markers to edit or block/unblock seats
        </p>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden gap-6 p-6">
        {/* Floor Plan Container */}
        <div className="flex-1">
          <div
            ref={containerRef}
            className="w-full h-full bg-white rounded-lg border border-gray-200 shadow-sm"
            style={{ minHeight: '500px' }}
          />
        </div>

        {/* Desks List Sidebar */}
        <div className="w-80 bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Desks ({desks.length})
            </h2>
          </div>
          <div className="flex-1 overflow-y-auto">
            <div className="divide-y divide-gray-200">
              {desks.map((desk) => (
                <div
                  key={desk.id}
                  className="p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{desk.name}</p>
                      <p className="text-sm text-gray-500">{desk.description}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        Position: ({desk.position[0]}, {desk.position[1]})
                      </p>
                    </div>
                    <div
                      className={`w-3 h-3 rounded-full ${
                        desk.isBlocked ? 'bg-red-500' : 'bg-green-500'
                      }`}
                    />
                  </div>
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={() => handleEditDesk(desk.id)}
                      disabled={isLoading}
                      className="flex-1 px-3 py-1 text-sm bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleToggleBlock(desk.id)}
                      disabled={isLoading}
                      className={`flex-1 px-3 py-1 text-sm rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                        desk.isBlocked
                          ? 'bg-green-50 text-green-600 hover:bg-green-100'
                          : 'bg-red-50 text-red-600 hover:bg-red-100'
                      }`}
                    >
                      {desk.isBlocked ? 'Unblock' : 'Block'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Tooltip */}
      {tooltip.visible && selectedDesk && (
        <div
          className="fixed bg-white border border-gray-300 rounded-lg shadow-lg p-3 z-50"
          style={{
            left: `${tooltip.x}px`,
            top: `${tooltip.y}px`,
            minWidth: '200px',
          }}
        >
          <p className="font-semibold text-gray-900 mb-1">{selectedDesk.name}</p>
          <p className="text-sm text-gray-600 mb-3">{selectedDesk.description}</p>
          <div className="space-y-2">
            <button
              onClick={() => handleEditDesk(tooltip.deskId!)}
              disabled={isLoading}
              className="w-full px-3 py-2 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Loading...' : 'Edit'}
            </button>
            <button
              onClick={() => handleToggleBlock(tooltip.deskId!)}
              disabled={isLoading}
              className={`w-full px-3 py-2 text-sm rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                selectedDesk.isBlocked
                  ? 'bg-green-500 text-white hover:bg-green-600'
                  : 'bg-red-500 text-white hover:bg-red-600'
              }`}
            >
              {isLoading ? 'Loading...' : selectedDesk.isBlocked ? 'Unblock' : 'Block'}
            </button>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingDeskId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 shadow-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Edit Desk
            </h3>
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                {error}
              </div>
            )}
            <input
              type="text"
              value={editingDeskName}
              onChange={(e) => setEditingDeskName(e.target.value)}
              disabled={isLoading}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
              placeholder="Desk name"
            />
            <textarea
              value={editingDeskDescription}
              onChange={(e) => setEditingDeskDescription(e.target.value)}
              disabled={isLoading}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
              placeholder="Desk description"
              rows={3}
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => {
                  setEditingDeskId(null)
                  setError(null)
                }}
                disabled={isLoading}
                className="px-4 py-2 text-sm bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveDesk}
                disabled={isLoading}
                className="px-4 py-2 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
