'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'


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

// Loading component for sections
const SectionLoading = ({ message }: { message: string }) => (
  <div className="bg-white border rounded-lg p-8">
    <div className="flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-3 text-sm text-gray-600">{message}</p>
      </div>
    </div>
  </div>
)

export default function JiraTaskAccountingPage() {
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  )
  const [jiraWorklogs, setJiraWorklogs] = useState<JiraWorklogEntry[]>([])
  const [isLoadingWorklogs, setIsLoadingWorklogs] = useState(false)

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

  // Fetch JIRA worklogs for the selected date
  const fetchJiraWorklogs = async () => {
    setIsLoadingWorklogs(true)
    try {
      const worklogsResponse = await fetch(`/api/jira/worklogs?date=${selectedDate}`)
      if (worklogsResponse.ok) {
        const worklogsData = await worklogsResponse.json()
        setJiraWorklogs(worklogsData)
      }
    } catch (error) {
      console.error('Failed to fetch JIRA worklogs:', error)
    } finally {
      setIsLoadingWorklogs(false)
    }
  }

  // Load worklogs when date changes
  useEffect(() => {
    fetchJiraWorklogs()
  }, [selectedDate])

  // Calculate total from JIRA worklogs
  const totalJiraWorklogSeconds = jiraWorklogs.reduce(
    (sum, entry) => sum + (entry.worklog.timeSpentSeconds || 0),
    0
  )

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">JIRA Task Accounting</h1>
          <div className="flex items-center gap-4">
            <Label htmlFor="date">Date:</Label>
            <Input
              id="date"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-40"
            />
            <Button onClick={fetchJiraWorklogs} disabled={isLoadingWorklogs}>
              {isLoadingWorklogs ? 'Loading...' : 'Refresh'}
            </Button>
          </div>
        </div>

        {/* Summary Card */}
        <div className="grid grid-cols-1 gap-4">
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
            <div className="text-sm text-purple-600 font-medium">Total Time Logged in JIRA</div>
            <div className="text-3xl font-bold text-purple-900">{formatSeconds(totalJiraWorklogSeconds)}</div>
            <div className="text-sm text-purple-600 mt-1">
              {jiraWorklogs.length} {jiraWorklogs.length === 1 ? 'entry' : 'entries'}
            </div>
          </div>
        </div>


        {/* JIRA Worklogs Section */}
        {isLoadingWorklogs ? (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-purple-600">Work Log Entries</h2>
            <SectionLoading message="Loading JIRA worklogs..." />
          </div>
        ) : jiraWorklogs.length > 0 ? (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-purple-600">Work Log Entries</h2>
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
        ) : null}

        {/* Empty State */}
        {jiraWorklogs.length === 0 && !isLoadingWorklogs && (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <p className="text-gray-500">No JIRA work logs found for {selectedDate}</p>
          </div>
        )}
      </div>
    </div>
  )
}