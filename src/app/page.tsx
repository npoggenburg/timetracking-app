'use client'

import { useState, useRef, useEffect } from 'react'
import { TimeEntryForm } from '@/components/time-entry-form'
import { TimeEntriesSidebar, TimeEntriesSidebarRef } from '@/components/time-entries-sidebar'

interface TimeEntryData {
  type: 'jira' | 'category'
  jiraTask?: any
  category?: any
  hours: number
  date: string
  description?: string
}

export default function Home() {
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const sidebarRef = useRef<TimeEntriesSidebarRef>(null)

  const handleTimeEntrySubmit = async (data: TimeEntryData) => {
    setIsLoading(true)
    setMessage(null)

    try {
      const response = await fetch('/api/time-entries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create time entry')
      }

      const result = await response.json()
      setMessage({ type: 'success', text: 'Time entry added successfully!' })
      setRefreshTrigger(prev => prev + 1) // Trigger sidebar refresh
      console.log('Time entry created:', result)
    } catch (error) {
      console.error('Error creating time entry:', error)
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'Failed to create time entry'
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Keyboard shortcut for focusing sidebar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Focus sidebar with Ctrl+Shift+M
      if (e.key.toLowerCase() === 'm' && e.ctrlKey && e.shiftKey) {
        e.preventDefault()
        sidebarRef.current?.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Main Content */}
      <div className="flex-1">
        <div className="container mx-auto px-4 py-8 max-w-2xl">
          <header className="mb-8 text-center">
            <h1 className="text-3xl font-bold tracking-tight">Time Tracking</h1>
            <p className="text-muted-foreground mt-2">
              Track your time on JIRA tasks and internal activities
            </p>
          </header>

          {message && (
            <div className={`mb-6 rounded-md border px-4 py-3 ${
              message.type === 'success' 
                ? 'border-green-200 bg-green-50 text-green-800' 
                : 'border-red-200 bg-red-50 text-red-800'
            }`}>
              {message.text}
            </div>
          )}

          <div className="rounded-lg border bg-white p-6 shadow-sm border-slate-200">
            <TimeEntryForm 
              onSubmit={handleTimeEntrySubmit}
              isLoading={isLoading}
            />
          </div>

          <footer className="mt-8 text-center text-sm text-muted-foreground">
            <p>Built with Next.js, Prisma, and Shadcn/UI</p>
          </footer>
        </div>
      </div>

      {/* Right Sidebar */}
      <TimeEntriesSidebar ref={sidebarRef} refreshTrigger={refreshTrigger} />
    </div>
  )
}