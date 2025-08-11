'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'

interface TimeEntry {
  id: string
  date: string
  hours?: number | null
  jiraKey?: string | null
  jiraBillingPackage?: string | null
  categoryId?: string | null
  category?: {
    id: string
    name: string
    color?: string
    type?: string
  }
  description?: string | null
}

interface JiraTaskWithTracking {
  key: string
  summary: string
  billingPackage?: string
  timeTracking?: {
    originalEstimate?: string
    remainingEstimate?: string
    timeSpent?: string
    originalEstimateSeconds?: number
    remainingEstimateSeconds?: number
    timeSpentSeconds?: number
  }
}

interface JiraWorklogEntry {
  issueKey: string
  summary: string
  worklog: {
    id: string
    author: {
      displayName: string
    }
    started: string
    timeSpent: string
    timeSpentSeconds: number
    comment?: string
  }
}

export default function DailyTimetrackingPage() {
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  )
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([])
  const [jiraTasksData, setJiraTasksData] = useState<Map<string, JiraTaskWithTracking>>(new Map())
  const [jiraWorklogs, setJiraWorklogs] = useState<JiraWorklogEntry[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // Format seconds to readable time string
  const formatSeconds = (seconds?: number) => {
    if (!seconds) return '-'
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    if (hours > 0 && minutes > 0) {
      return `${hours}h ${minutes}m`
    } else if (hours > 0) {
      return `${hours}h`
    } else if (minutes > 0) {
      return `${minutes}m`
    }
    return '-'
  }

  // Format hours to display string
  const formatHours = (hours?: number | null) => {
    if (!hours) return '-'
    const h = Math.floor(hours)
    const m = Math.round((hours - h) * 60)
    if (h > 0 && m > 0) {
      return `${h}h ${m}m`
    } else if (h > 0) {
      return `${h}h`
    } else if (m > 0) {
      return `${m}m`
    }
    return '-'
  }

  // Fetch time entries for the selected date
  const fetchTimeEntries = async () => {
    setIsLoading(true)
    try {
      // Fetch local time entries
      const response = await fetch(`/api/time-entries?date=${selectedDate}`)
      if (response.ok) {
        const data = await response.json()
        setTimeEntries(data)
        
        // Fetch JIRA data for each unique JIRA key
        const jiraKeys = [...new Set(data
          .filter((entry: TimeEntry) => entry.jiraKey)
          .map((entry: TimeEntry) => entry.jiraKey))]
        
        await fetchJiraData(jiraKeys as string[])
      }
      
      // Fetch JIRA worklogs for the date
      const worklogsResponse = await fetch(`/api/jira/worklogs?date=${selectedDate}`)
      if (worklogsResponse.ok) {
        const worklogsData = await worklogsResponse.json()
        setJiraWorklogs(worklogsData)
      }
    } catch (error) {
      console.error('Failed to fetch time entries:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Fetch JIRA task data with timetracking info
  const fetchJiraData = async (jiraKeys: string[]) => {
    const newJiraData = new Map<string, JiraTaskWithTracking>()
    
    for (const key of jiraKeys) {
      try {
        const response = await fetch(`/api/jira/task/${key}`)
        if (response.ok) {
          const task = await response.json()
          newJiraData.set(key, task)
        }
      } catch (error) {
        console.error(`Failed to fetch JIRA task ${key}:`, error)
      }
    }
    
    setJiraTasksData(newJiraData)
  }

  // Load entries when date changes
  useEffect(() => {
    fetchTimeEntries()
  }, [selectedDate])

  // Group entries by type
  const jiraEntries = timeEntries.filter(entry => entry.jiraKey)
  const categoryEntries = timeEntries.filter(entry => entry.categoryId)

  // Calculate totals
  const totalLoggedHours = timeEntries.reduce((sum, entry) => sum + (entry.hours || 0), 0)
  const totalJiraHours = jiraEntries.reduce((sum, entry) => sum + (entry.hours || 0), 0)
  const totalCategoryHours = categoryEntries.reduce((sum, entry) => sum + (entry.hours || 0), 0)

  // Calculate total JIRA time spent from JIRA API
  const totalJiraTimeSpent = Array.from(jiraTasksData.values()).reduce(
    (sum, task) => sum + (task.timeTracking?.timeSpentSeconds || 0), 
    0
  )
  
  // Calculate total from JIRA worklogs
  const totalJiraWorklogSeconds = jiraWorklogs.reduce(
    (sum, entry) => sum + (entry.worklog.timeSpentSeconds || 0),
    0
  )

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Daily Timetracking Overview</h1>
          <div className="flex items-center gap-4">
            <Label htmlFor="date">Date:</Label>
            <Input
              id="date"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-40"
            />
            <Button onClick={fetchTimeEntries} disabled={isLoading}>
              {isLoading ? 'Loading...' : 'Refresh'}
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="text-sm text-blue-600 font-medium">Local Logged</div>
            <div className="text-2xl font-bold text-blue-900">{formatHours(totalLoggedHours)}</div>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="text-sm text-green-600 font-medium">Local JIRA</div>
            <div className="text-2xl font-bold text-green-900">{formatHours(totalJiraHours)}</div>
          </div>
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="text-sm text-orange-600 font-medium">Internal</div>
            <div className="text-2xl font-bold text-orange-900">{formatHours(totalCategoryHours)}</div>
          </div>
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <div className="text-sm text-purple-600 font-medium">JIRA Worklogs</div>
            <div className="text-2xl font-bold text-purple-900">{formatSeconds(totalJiraWorklogSeconds)}</div>
          </div>
          <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
            <div className="text-sm text-indigo-600 font-medium">JIRA Total Time</div>
            <div className="text-2xl font-bold text-indigo-900">{formatSeconds(totalJiraTimeSpent)}</div>
          </div>
        </div>

        {/* JIRA Tasks Section */}
        {jiraEntries.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-blue-600">Local JIRA Task Entries</h2>
            <div className="bg-white border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-gray-700">Task Key</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-700">Summary</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-700">Billing Package</th>
                    <th className="text-right px-4 py-3 font-medium text-gray-700">Logged Time</th>
                    <th className="text-right px-4 py-3 font-medium text-gray-700">JIRA Time Spent</th>
                    <th className="text-right px-4 py-3 font-medium text-gray-700">Original Estimate</th>
                    <th className="text-right px-4 py-3 font-medium text-gray-700">Remaining</th>
                  </tr>
                </thead>
                <tbody>
                  {jiraEntries.map(entry => {
                    const jiraTask = jiraTasksData.get(entry.jiraKey!)
                    return (
                      <tr key={entry.id} className="border-b hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-blue-600">
                          {entry.jiraKey}
                        </td>
                        <td className="px-4 py-3 text-gray-700">
                          {jiraTask?.summary || '-'}
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {entry.jiraBillingPackage || '-'}
                        </td>
                        <td className="px-4 py-3 text-right font-medium">
                          {formatHours(entry.hours)}
                        </td>
                        <td className="px-4 py-3 text-right text-purple-600">
                          {formatSeconds(jiraTask?.timeTracking?.timeSpentSeconds)}
                        </td>
                        <td className="px-4 py-3 text-right text-gray-600">
                          {formatSeconds(jiraTask?.timeTracking?.originalEstimateSeconds)}
                        </td>
                        <td className="px-4 py-3 text-right text-gray-600">
                          {formatSeconds(jiraTask?.timeTracking?.remainingEstimateSeconds)}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* JIRA Worklogs Section (from JIRA API) */}
        {jiraWorklogs.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-purple-600">JIRA Worklogs (from JIRA API)</h2>
            <div className="bg-white border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-gray-700">Issue Key</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-700">Summary</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-700">Author</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-700">Comment</th>
                    <th className="text-right px-4 py-3 font-medium text-gray-700">Time Spent</th>
                  </tr>
                </thead>
                <tbody>
                  {jiraWorklogs.map((entry, index) => (
                    <tr key={`${entry.worklog.id}-${index}`} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-purple-600">
                        {entry.issueKey}
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {entry.summary}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {entry.worklog.author.displayName}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {entry.worklog.comment || '-'}
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-purple-600">
                        {formatSeconds(entry.worklog.timeSpentSeconds)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Internal Activities Section */}
        {categoryEntries.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-orange-600">Internal Activities</h2>
            <div className="bg-white border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-gray-700">Category</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-700">Description</th>
                    <th className="text-right px-4 py-3 font-medium text-gray-700">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {categoryEntries.map(entry => (
                    <tr key={entry.id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <span 
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium"
                          style={{
                            backgroundColor: entry.category?.color ? `${entry.category.color}20` : '#f3f4f6',
                            color: entry.category?.color || '#374151'
                          }}
                        >
                          {entry.category?.name || 'Unknown'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {entry.description || '-'}
                      </td>
                      <td className="px-4 py-3 text-right font-medium">
                        {entry.category?.type === 'day' ? 'Full Day' : formatHours(entry.hours)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Empty State */}
        {timeEntries.length === 0 && !isLoading && (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <p className="text-gray-500">No time entries found for {selectedDate}</p>
          </div>
        )}
      </div>
    </div>
  )
}