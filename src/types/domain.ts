// Domain Models - Core business entities
// Following Domain-Driven Design principles

export interface TimeEntry {
  id: string
  date: string
  hours?: number | null
  jiraKey?: string | null
  jiraBillingPackage?: string | null
  categoryId?: string | null
  category?: Category | null
  description?: string | null
  createdAt?: string
  updatedAt?: string
}

export interface Category {
  id: string
  name: string
  description?: string
  color?: string
  type?: CategoryType
  createdAt?: string
  updatedAt?: string
}

export type CategoryType = 'time' | 'day'

export interface DailyWorkTime {
  id?: string
  date: string
  totalHours: number
  createdAt?: string
  updatedAt?: string
}

// Value Objects
export interface TimeRange {
  start: string
  end: string
}

export interface DateRange {
  startDate: string
  endDate: string
}

// Aggregates
export interface DayData {
  date: Date
  timeEntries: TimeEntry[]
  officeTime?: number
  totalTaskHours: number
  totalJiraHours: number
  totalCategoryHours: number
}

// API Response Types
export interface ApiResponse<T> {
  data: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  page: number
  limit: number
  total: number
  hasMore: boolean
}

// Status Types
export type LoadingState = 'idle' | 'loading' | 'success' | 'error'

export interface LoadingStates {
  entries: LoadingState
  jiraData: LoadingState
  worklogs: LoadingState
}

export type DayStatus = 
  | 'complete' 
  | 'mismatch' 
  | 'missing' 
  | 'no-office-time' 
  | 'no-entries' 
  | 'weekend' 
  | 'future'

// Form Types
export interface TimeEntryFormData {
  type: 'jira' | 'category'
  jiraTask?: JiraTask
  category?: Category
  hours?: number
  date: string
  endDate?: string
  description?: string
}

// Re-export JIRA types for convenience
export type { JiraTask, JiraTimeTracking, JiraWorklog } from './jira'