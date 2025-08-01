'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { TimeInput, TimeInputRef } from '@/components/ui/time-input'
import { X, Save, Calendar, Clock, FileText } from 'lucide-react'
import { useRef } from 'react'
import { roundToNearestQuarterHour } from '@/lib/time-utils'

interface TimeEntry {
  id: string
  hours?: number
  date: string
  endDate?: string
  jiraKey?: string
  jiraBillingPackage?: string
  description?: string
  category?: {
    id: string
    name: string
    color?: string
    type?: string
  }
}

interface TimeEntryEditPopoverProps {
  entry: TimeEntry
  isOpen: boolean
  onClose: () => void
  onSave: (entryId: string, updates: { hours?: number; date: string; endDate?: string; description?: string }) => Promise<void>
  position: { x: number; y: number }
}

export function TimeEntryEditPopover({ entry, isOpen, onClose, onSave, position }: TimeEntryEditPopoverProps) {
  const [timeDisplay, setTimeDisplay] = useState('')
  const [decimalHours, setDecimalHours] = useState(0)
  const [date, setDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [description, setDescription] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  
  const timeInputRef = useRef<TimeInputRef>(null)

  // Initialize all fields when entry changes
  useEffect(() => {
    // Initialize time display and decimal hours
    if (entry.hours && typeof entry.hours === 'number' && !isNaN(entry.hours)) {
      const hours = Math.floor(entry.hours)
      const minutes = Math.round((entry.hours - hours) * 60)
      const display = minutes > 0 ? `${hours}h${minutes}m` : `${hours}h`
      setTimeDisplay(display)
      setDecimalHours(entry.hours)
    } else {
      setTimeDisplay('')
      setDecimalHours(0)
    }

    // Initialize other fields
    setDate(entry.date.split('T')[0])
    setEndDate(entry.endDate ? entry.endDate.split('T')[0] : '')
    setDescription(entry.description || '')
  }, [entry.id, entry.hours, entry.date, entry.endDate, entry.description])

  // Handle keyboard shortcuts
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      } else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        // Ctrl+Enter or Cmd+Enter to save from anywhere
        e.preventDefault()
        handleSave()
      } else if (e.key === 'Enter' && e.target instanceof HTMLElement && 
                 !['INPUT', 'TEXTAREA'].includes(e.target.tagName)) {
        // Enter to save when not in an input field
        e.preventDefault()
        handleSave()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen])

  // Focus on time input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        timeInputRef.current?.focus()
      }, 100)
    }
  }, [isOpen])

  const handleTimeChange = (displayValue: string, decimalValue: number) => {
    setTimeDisplay(displayValue)
    setDecimalHours(decimalValue)
  }

  const handleSave = async () => {
    setIsLoading(true)
    try {
      const updates: any = {
        date,
        description: description.trim() || undefined
      }

      // Add rounded hours only for time-based entries
      if (entry.category?.type !== 'day' || entry.jiraKey) {
        // Validate that we have a valid time value
        if (typeof decimalHours !== 'number' || isNaN(decimalHours) || decimalHours <= 0) {
          alert('Please enter a valid time value')
          return
        }
        
        const roundedHours = roundToNearestQuarterHour(decimalHours)
        updates.hours = roundedHours
      }

      // Add end date for day-based entries
      if (entry.category?.type === 'day' && endDate) {
        updates.endDate = endDate
      }

      await onSave(entry.id, updates)
      onClose()
    } catch (error) {
      console.error('Error saving entry:', error)
      alert('Failed to save entry. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  const isDayBased = entry.category?.type === 'day'

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/20 z-40" onClick={onClose} />
      
      {/* Popover */}
      <div 
        className="fixed z-50 bg-white border border-slate-200 rounded-lg shadow-lg p-4 w-80"
        style={{
          left: position.x,
          top: position.y
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-sm flex items-center gap-2">
            <Save className="h-4 w-4" />
            Edit Entry
          </h3>
          <button
            onClick={onClose}
            className="h-6 w-6 rounded-full hover:bg-slate-100 flex items-center justify-center"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Entry Info */}
        <div className="mb-4 p-2 bg-slate-50 rounded text-xs">
          <div className="font-medium truncate">
            {entry.jiraKey || entry.category?.name}
          </div>
          {entry.jiraBillingPackage && (
            <div className="text-blue-600">{entry.jiraBillingPackage}</div>
          )}
        </div>

        {/* Form */}
        <div className="space-y-4">
          {/* Date */}
          <div className="space-y-1">
            <Label htmlFor="edit-date" className="text-xs flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              Date
            </Label>
            <Input
              id="edit-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="text-sm"
            />
          </div>

          {/* End Date (for day-based entries) */}
          {isDayBased && (
            <div className="space-y-1">
              <Label htmlFor="edit-end-date" className="text-xs">
                End Date (Optional)
              </Label>
              <Input
                id="edit-end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="text-sm"
              />
            </div>
          )}

          {/* Time (for time-based entries) */}
          {!isDayBased && (
            <div className="space-y-1">
              <Label className="text-xs flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Time
              </Label>
              <TimeInput
                ref={timeInputRef}
                value={timeDisplay}
                onChange={handleTimeChange}
                placeholder="e.g., 2h30m"
                className="text-sm"
              />
            </div>
          )}

          {/* Description */}
          <div className="space-y-1">
            <Label htmlFor="edit-description" className="text-xs flex items-center gap-1">
              <FileText className="h-3 w-3" />
              Description
            </Label>
            <textarea
              id="edit-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add notes..."
              className="flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 resize-none"
              rows={2}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="mt-4 flex gap-2">
          <Button
            onClick={handleSave}
            disabled={isLoading || (!isDayBased && decimalHours <= 0)}
            size="sm"
            className="flex-1 text-xs"
          >
            {isLoading ? 'Saving...' : 'Save'}
            <span className="ml-2 text-xs opacity-60">↵</span>
          </Button>
          <Button
            onClick={onClose}
            variant="outline"
            size="sm"
            className="text-xs"
          >
            Cancel
            <span className="ml-2 text-xs opacity-60">Esc</span>
          </Button>
        </div>
      </div>
    </>
  )
}