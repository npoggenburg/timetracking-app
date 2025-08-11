// API Types - Request/Response types for all endpoints
// Following Interface Segregation Principle

import type { TimeEntry, Category, DailyWorkTime } from './domain'
import type { JiraTask, JiraWorklog } from './jira'

// Generic API Types
export interface ApiError {
  error: string
  message?: string
  code?: number
}

export interface ApiSuccess<T = unknown> {
  data: T
  message?: string
}

export type ApiResult<T> = ApiSuccess<T> | ApiError

// Request Types
export interface CreateTimeEntryRequest {
  type: 'jira' | 'category'
  jiraTask?: {
    key: string
    summary?: string
    billingPackage?: string
  }
  category?: {
    id: string
  }
  hours?: number
  date: string
  endDate?: string
  description?: string
}

export interface UpdateTimeEntryRequest extends Partial<CreateTimeEntryRequest> {
  id: string
}

export interface CreateCategoryRequest {
  name: string
  description?: string
  color?: string
  type?: 'time' | 'day'
}

export interface UpdateDailyWorkTimeRequest {
  date: string
  totalHours: number
}

// Query Parameters
export interface TimeEntriesQuery {
  date?: string
  startDate?: string
  endDate?: string
  categoryId?: string
  jiraKey?: string
}

export interface JiraSearchQuery {
  query: string
  limit?: number
}

export interface JiraWorklogsQuery {
  date: string
  author?: string
}

// Response Types
export type TimeEntriesResponse = ApiResult<TimeEntry[]>
export type TimeEntryResponse = ApiResult<TimeEntry>
export type CategoriesResponse = ApiResult<Category[]>
export type CategoryResponse = ApiResult<Category>
export type DailyWorkTimesResponse = ApiResult<DailyWorkTime[]>
export type DailyWorkTimeResponse = ApiResult<DailyWorkTime>

// JIRA API Response Types
export type JiraTasksResponse = ApiResult<JiraTask[]>
export type JiraTaskResponse = ApiResult<JiraTask>
export type JiraWorklogsResponse = ApiResult<Array<{
  issueKey: string
  summary: string
  worklog: JiraWorklog
}>>

// Utility type for extracting data from API responses
export type ExtractApiData<T> = T extends ApiSuccess<infer U> ? U : never

// Type guards
export const isApiError = (response: ApiResult<unknown>): response is ApiError => {
  return 'error' in response
}

export const isApiSuccess = <T>(response: ApiResult<T>): response is ApiSuccess<T> => {
  return 'data' in response
}