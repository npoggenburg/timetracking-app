// Time Entry Service - Implements Dependency Inversion Principle
// Abstract away API calls and provide clean interfaces

export interface TimeEntryData {
  type: 'jira' | 'category'
  jiraTask?: {
    key: string
    summary: string
    billingPackage?: string
  }
  category?: {
    id: string
    name: string
    color?: string
    type?: string
  }
  hours?: number
  date: string
  endDate?: string
  description?: string
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}

export interface TimeEntryServiceInterface {
  createTimeEntry(data: TimeEntryData): Promise<ApiResponse<any>>
  clearAllEntries(): Promise<ApiResponse<{ count: number }>>
}

export class TimeEntryService implements TimeEntryServiceInterface {
  private readonly baseUrl: string

  constructor(baseUrl: string = '/api/time-entries') {
    this.baseUrl = baseUrl
  }

  async createTimeEntry(data: TimeEntryData): Promise<ApiResponse<any>> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        return {
          success: false,
          error: error.error || 'Failed to create time entry'
        }
      }

      const result = await response.json()
      return {
        success: true,
        data: result
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create time entry'
      }
    }
  }

  async clearAllEntries(): Promise<ApiResponse<{ count: number }>> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        return {
          success: false,
          error: error.error || 'Failed to clear entries'
        }
      }

      const result = await response.json()
      return {
        success: true,
        data: result
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to clear entries'
      }
    }
  }
}

// Factory function for dependency injection
export const createTimeEntryService = (): TimeEntryServiceInterface => {
  return new TimeEntryService()
}