// Daily Timetracking Data Hook
// Following functional programming and SOLID principles

import { useState, useEffect, useCallback } from 'react'
import type { TimeEntry } from '@/types/domain'
import type { JiraWorklog, JiraTask } from '@/types/jira'
import type { LoadingState } from '@/types/domain'
import { retry, Result, Ok, Err } from '@/lib/functional'

// Types for the hook
export interface JiraTaskWithTracking extends JiraTask {
  timeTracking?: {
    originalEstimate?: string
    remainingEstimate?: string
    timeSpent?: string
    originalEstimateSeconds?: number
    remainingEstimateSeconds?: number
    timeSpentSeconds?: number
  }
}

export interface JiraWorklogEntry {
  issueKey: string
  summary: string
  worklog: JiraWorklog
}

export interface DailyDataState {
  timeEntries: TimeEntry[]
  jiraTasksData: Map<string, JiraTaskWithTracking>
  jiraWorklogs: JiraWorklogEntry[]
  loadingStates: {
    entries: LoadingState
    jiraData: LoadingState
    worklogs: LoadingState
  }
}

export interface DailyDataActions {
  fetchTimeEntries: () => Promise<Result<TimeEntry[], Error>>
  fetchJiraData: (jiraKeys: string[]) => Promise<Result<void, Error>>
  fetchJiraWorklogs: () => Promise<Result<JiraWorklogEntry[], Error>>
  refetchAll: () => Promise<void>
  reset: () => void
}

export interface UseDailyDataOptions {
  date: string
  retryAttempts?: number
  retryDelay?: number
}

export const useDailyData = ({
  date,
  retryAttempts = 3,
  retryDelay = 1000
}: UseDailyDataOptions): DailyDataState & DailyDataActions => {
  // State management
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([])
  const [jiraTasksData, setJiraTasksData] = useState<Map<string, JiraTaskWithTracking>>(new Map())
  const [jiraWorklogs, setJiraWorklogs] = useState<JiraWorklogEntry[]>([])
  
  const [loadingStates, setLoadingStates] = useState({
    entries: 'idle' as LoadingState,
    jiraData: 'idle' as LoadingState,
    worklogs: 'idle' as LoadingState
  })

  // Update loading state helper
  const updateLoadingState = useCallback((
    type: keyof typeof loadingStates,
    state: LoadingState
  ) => {
    setLoadingStates(prev => ({ ...prev, [type]: state }))
  }, [])

  // Fetch time entries
  const fetchTimeEntries = useCallback(async (): Promise<Result<TimeEntry[], Error>> => {
    updateLoadingState('entries', 'loading')
    
    const result = await retry(
      async () => {
        const response = await fetch(`/api/time-entries?date=${date}`)
        if (!response.ok) {
          throw new Error(`Failed to fetch time entries: ${response.statusText}`)
        }
        return response.json() as Promise<TimeEntry[]>
      },
      retryAttempts,
      retryDelay
    )

    if (result.success) {
      setTimeEntries(result.data)
      updateLoadingState('entries', 'success')
      
      // Extract JIRA keys for further fetching
      const jiraKeys = [...new Set(
        result.data
          .filter(entry => entry.jiraKey)
          .map(entry => entry.jiraKey!)
      )]
      
      if (jiraKeys.length > 0) {
        await fetchJiraData(jiraKeys)
      }
      
      return Ok(result.data)
    } else {
      updateLoadingState('entries', 'error')
      return Err(result.error)
    }
  }, [date, retryAttempts, retryDelay, updateLoadingState])

  // Fetch JIRA task data
  const fetchJiraData = useCallback(async (jiraKeys: string[]): Promise<Result<void, Error>> => {
    if (jiraKeys.length === 0) return Ok(undefined)
    
    updateLoadingState('jiraData', 'loading')
    
    try {
      const newJiraData = new Map<string, JiraTaskWithTracking>()
      
      // Fetch all JIRA tasks in parallel
      const fetchPromises = jiraKeys.map(async (key) => {
        const result = await retry(
          async () => {
            const response = await fetch(`/api/jira/task/${key}`)
            if (!response.ok) {
              throw new Error(`Failed to fetch JIRA task ${key}: ${response.statusText}`)
            }
            return response.json() as Promise<JiraTaskWithTracking>
          },
          retryAttempts,
          retryDelay
        )
        
        if (result.success) {
          return { key, task: result.data }
        }
        throw result.error
      })
      
      const results = await Promise.allSettled(fetchPromises)
      
      results.forEach((result) => {
        if (result.status === 'fulfilled') {
          newJiraData.set(result.value.key, result.value.task)
        }
      })
      
      setJiraTasksData(newJiraData)
      updateLoadingState('jiraData', 'success')
      return Ok(undefined)
      
    } catch (error) {
      updateLoadingState('jiraData', 'error')
      return Err(error instanceof Error ? error : new Error(String(error)))
    }
  }, [retryAttempts, retryDelay, updateLoadingState])

  // Fetch JIRA worklogs
  const fetchJiraWorklogs = useCallback(async (): Promise<Result<JiraWorklogEntry[], Error>> => {
    updateLoadingState('worklogs', 'loading')
    
    const result = await retry(
      async () => {
        const response = await fetch(`/api/jira/worklogs?date=${date}`)
        if (!response.ok) {
          throw new Error(`Failed to fetch JIRA worklogs: ${response.statusText}`)
        }
        return response.json() as Promise<JiraWorklogEntry[]>
      },
      retryAttempts,
      retryDelay
    )

    if (result.success) {
      setJiraWorklogs(result.data)
      updateLoadingState('worklogs', 'success')
      return Ok(result.data)
    } else {
      updateLoadingState('worklogs', 'error')
      return Err(result.error)
    }
  }, [date, retryAttempts, retryDelay, updateLoadingState])

  // Refetch all data
  const refetchAll = useCallback(async () => {
    const [entriesResult] = await Promise.allSettled([
      fetchTimeEntries(),
      fetchJiraWorklogs()
    ])
    
    // Note: JIRA data is fetched as part of fetchTimeEntries
    if (entriesResult.status === 'rejected') {
      console.error('Failed to refetch time entries:', entriesResult.reason)
    }
  }, [fetchTimeEntries, fetchJiraWorklogs])

  // Reset state
  const reset = useCallback(() => {
    setTimeEntries([])
    setJiraTasksData(new Map())
    setJiraWorklogs([])
    setLoadingStates({
      entries: 'idle',
      jiraData: 'idle',
      worklogs: 'idle'
    })
  }, [])

  // Load data when date changes
  useEffect(() => {
    reset()
    refetchAll()
  }, [date]) // Only depend on date, not the functions to avoid infinite loops

  return {
    // State
    timeEntries,
    jiraTasksData,
    jiraWorklogs,
    loadingStates,
    
    // Actions
    fetchTimeEntries,
    fetchJiraData,
    fetchJiraWorklogs,
    refetchAll,
    reset
  }
}