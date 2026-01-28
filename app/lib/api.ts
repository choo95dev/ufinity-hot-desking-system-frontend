// Mock API service for desk management

interface DeskUpdatePayload {
  id: string
  name: string
  description: string
}

interface DeskBlockPayload {
  id: string
  isBlocked: boolean
}

interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}

// Simulate API delay
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export const deskApi = {
  // Mock API call to update desk (name and description)
  async updateDesk(payload: DeskUpdatePayload): Promise<ApiResponse<DeskUpdatePayload>> {
    try {
      await delay(800) // Simulate network delay
      
      // Simulate random failure 5% of the time
      if (Math.random() < 0.05) {
        throw new Error('Failed to update desk')
      }

      console.log('API: Updated desk', payload)
      return {
        success: true,
        data: payload,
      }
    } catch (error) {
      console.error('API Error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  },

  // Mock API call to block/unblock desk
  async toggleDeskBlock(payload: DeskBlockPayload): Promise<ApiResponse<DeskBlockPayload>> {
    try {
      await delay(600) // Simulate network delay

      // Simulate random failure 5% of the time
      if (Math.random() < 0.05) {
        throw new Error('Failed to toggle desk block status')
      }

      console.log('API: Toggled desk block status', payload)
      return {
        success: true,
        data: payload,
      }
    } catch (error) {
      console.error('API Error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  },
}
