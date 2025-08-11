'use client'

import { useState, useRef, useEffect } from 'react'
import { useHotkeys } from 'react-hotkeys-hook'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { TimeInput, TimeInputRef } from '@/components/ui/time-input'
import { DateRangeInput } from '@/components/ui/date-range-input'
import { ConfirmationModal } from '@/components/ui/confirmation-modal'
import { JiraSearch, JiraSearchRef } from '@/components/jira-search'
import { CategorySelector, CategorySelectorRef } from '@/components/category-selector'
import { JiraTask } from '@/types/jira'
import { roundToNearestQuarterHour } from '@/lib/time-utils'

type EntryType = 'jira' | 'category'

interface Category {
  id: string
  name: string
  description?: string
  color?: string
  type?: string // 'time' or 'day'
}

interface TimeEntryData {
  type: EntryType
  jiraTask?: JiraTask
  category?: Category
  hours?: number // Optional for day-based entries
  date: string
  endDate?: string // For day-based entries
  description?: string
}

interface TimeEntryFormProps {
  onSubmit: (data: TimeEntryData) => void
  isLoading?: boolean
}

export function TimeEntryForm({ onSubmit, isLoading = false }: TimeEntryFormProps) {
  const [entryType, setEntryType] = useState<EntryType>('jira')
  const [selectedJiraTask, setSelectedJiraTask] = useState<JiraTask | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)
  const [timeDisplay, setTimeDisplay] = useState<string>('')
  const [decimalHours, setDecimalHours] = useState<number>(0)
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0])
  const [endDate, setEndDate] = useState<string>('')
  const [description, setDescription] = useState<string>('')
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [pendingSubmission, setPendingSubmission] = useState<TimeEntryData | null>(null)
  const [isMac, setIsMac] = useState(false)

  // Refs for focus management
  const jiraSearchRef = useRef<JiraSearchRef>(null)
  const categorySelectorRef = useRef<CategorySelectorRef>(null)
  const timeInputRef = useRef<TimeInputRef>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (entryType === 'jira' && !selectedJiraTask) {
      alert('Please select a JIRA task')
      return
    }

    if (entryType === 'category' && !selectedCategory) {
      alert('Please select a category')
      return
    }

    // Validate based on category type
    const isDayBasedCategory = selectedCategory?.type === 'day'
    
    if (entryType === 'jira' || !isDayBasedCategory) {
      // Time-based validation
      if (decimalHours <= 0) {
        alert('Please enter valid time')
        return
      }
    } else {
      // Day-based validation
      if (!date) {
        alert('Please select a date')
        return
      }
    }

    // Round hours to nearest 15-minute increment for time-based entries
    const finalHours = (entryType === 'jira' || !isDayBasedCategory) 
      ? roundToNearestQuarterHour(decimalHours) 
      : undefined

    const timeEntryData: TimeEntryData = {
      type: entryType,
      date,
      description: description.trim() || undefined,
      ...(entryType === 'jira' && { jiraTask: selectedJiraTask! }),
      ...(entryType === 'category' && { category: selectedCategory! }),
      // Add rounded hours only for time-based entries
      ...(finalHours !== undefined && { hours: finalHours }),
      // Add end date only for day-based entries that have one
      ...(isDayBasedCategory && endDate && { endDate })
    }

    // Show confirmation modal instead of directly submitting
    setPendingSubmission(timeEntryData)
    setShowConfirmation(true)
  }

  const handleReset = () => {
    setSelectedJiraTask(null)
    setSelectedCategory(null)
    timeInputRef.current?.reset()
    setTimeDisplay('')
    setDecimalHours(0)
    setEndDate('')
    setDescription('')
  }

  const handleTimeChange = (displayValue: string, decimalValue: number) => {
    setTimeDisplay(displayValue)
    setDecimalHours(decimalValue)
  }

  // Detect if user is on Mac
  useEffect(() => {
    const platform = navigator.platform || navigator.userAgent
    setIsMac(/Mac|iPhone|iPod|iPad/i.test(platform))
  }, [])

  // Focus management
  useEffect(() => {
    // Focus on search field when switching tabs
    if (entryType === 'jira') {
      jiraSearchRef.current?.focus()
    }
    // Note: Category focus is handled by onCategoriesLoaded callback
  }, [entryType])

  // Keyboard shortcut for tab switching (Alt+M for cross-platform compatibility)
  // enableOnFormTags allows the hotkey to work even when inputs are focused
  useHotkeys('alt+m', (e) => {
    e.preventDefault()
    setEntryType(prev => prev === 'jira' ? 'category' : 'jira')
    if (entryType === 'jira') {
      setSelectedJiraTask(null)
    } else {
      setSelectedCategory(null)
    }
  }, {
    enableOnFormTags: ['INPUT', 'TEXTAREA', 'SELECT'],
  }, [entryType])

  const handleCategoriesLoaded = () => {
    // Focus on category search field after categories are loaded
    if (entryType === 'category') {
      categorySelectorRef.current?.focus()
    }
  }

  const handleJiraTaskSelect = (task: JiraTask) => {
    setSelectedJiraTask(task)
    // Focus on time input after selecting a task
    setTimeout(() => {
      timeInputRef.current?.focus()
    }, 100)
  }

  const handleCategorySelect = (category: Category) => {
    setSelectedCategory(category)
    // Focus on appropriate input after selecting a category
    setTimeout(() => {
      if (category.type === 'day') {
        // For day-based categories, don't focus on time input
        // The date input will be focused automatically
      } else {
        // For time-based categories, focus on time input
        timeInputRef.current?.focus()
      }
    }, 100)
  }

  // Confirmation handlers
  const handleConfirmSubmission = () => {
    if (pendingSubmission) {
      onSubmit(pendingSubmission)
      // Clear the time and description fields after successful submission
      timeInputRef.current?.reset()
      setTimeDisplay('')
      setDecimalHours(0)
      setDescription('')
      
      // Focus back to the appropriate search field
      setTimeout(() => {
        if (entryType === 'jira') {
          jiraSearchRef.current?.focus()
        } else {
          categorySelectorRef.current?.focus()
        }
      }, 100) // Small delay to ensure UI updates are complete
    }
    setShowConfirmation(false)
    setPendingSubmission(null)
  }

  const handleCancelSubmission = () => {
    setShowConfirmation(false)
    setPendingSubmission(null)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Entry Type Toggle */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-base font-semibold">Time Entry Type</Label>
          <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
            Press {isMac ? 'Option' : 'Alt'}+M to switch
          </span>
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            variant={entryType === 'jira' ? 'default' : 'outline'}
            onClick={() => {
              setEntryType('jira')
              setSelectedCategory(null)
            }}
            className={`flex-1 ${
              entryType === 'jira' 
                ? 'bg-blue-600 hover:bg-blue-700 border-blue-600 text-white' 
                : 'border-blue-300 text-blue-600 hover:bg-blue-50 hover:border-blue-400'
            }`}
          >
            JIRA Task
          </Button>
          <Button
            type="button"
            variant={entryType === 'category' ? 'default' : 'outline'}
            onClick={() => {
              setEntryType('category')
              setSelectedJiraTask(null)
            }}
            className={`flex-1 ${
              entryType === 'category' 
                ? 'bg-orange-600 hover:bg-orange-700 border-orange-600 text-white' 
                : 'border-orange-300 text-orange-600 hover:bg-orange-50 hover:border-orange-400'
            }`}
          >
            Internal Activity
          </Button>
        </div>
      </div>

      {/* JIRA Task Search */}
      {entryType === 'jira' && (
        <div className="space-y-2">
          <Label htmlFor="jira-search">JIRA Task</Label>
          <JiraSearch ref={jiraSearchRef} onTaskSelect={handleJiraTaskSelect} />
          {selectedJiraTask && (
            <div className="rounded-md border border-blue-200 bg-blue-50/50 p-3">
              <div className="font-medium">{selectedJiraTask.key}</div>
              <div className="text-sm text-muted-foreground">{selectedJiraTask.summary}</div>
              {selectedJiraTask.billingPackage && (
                <div className="text-xs text-blue-600 mt-1">
                  {selectedJiraTask.billingPackage}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Category Selection */}
      {entryType === 'category' && (
        <CategorySelector 
          ref={categorySelectorRef}
          onCategorySelect={handleCategorySelect}
          selectedCategory={selectedCategory}
          onCategoriesLoaded={handleCategoriesLoaded}
          theme="orange"
        />
      )}

      {/* Time/Date Input - Conditional based on category type */}
      {entryType === 'jira' || selectedCategory?.type !== 'day' ? (
        // Time-based input for JIRA tasks and time-based categories
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="date">Date *</Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="time">Time *</Label>
            <TimeInput
              ref={timeInputRef}
              value={timeDisplay}
              onChange={handleTimeChange}
              placeholder="e.g., 2h30m"
              required
            />
          </div>
        </div>
      ) : (
        // Day-based input for vacation, sick leave, etc.
        <div className="space-y-2">
          <DateRangeInput
            startDate={date}
            endDate={endDate}
            onStartDateChange={setDate}
            onEndDateChange={setEndDate}
            required
            singleDay={false}
          />
        </div>
      )}

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description">Description (Optional)</Label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Add any additional notes about this time entry..."
          className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          rows={3}
        />
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button
          type="submit"
          disabled={isLoading}
          className={`flex-1 ${
            entryType === 'jira'
              ? 'bg-blue-600 hover:bg-blue-700 border-blue-600 text-white disabled:bg-blue-300'
              : 'bg-orange-600 hover:bg-orange-700 border-orange-600 text-white disabled:bg-orange-300'
          }`}
        >
          {isLoading ? 'Adding...' : 'Add Time Entry'}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={handleReset}
          disabled={isLoading}
        >
          Reset
        </Button>
      </div>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={showConfirmation}
        title="Confirm Time Entry"
        message={`Are you sure you want to add this time entry${pendingSubmission?.type === 'jira' && pendingSubmission.jiraTask ? ` for ${pendingSubmission.jiraTask.key}` : pendingSubmission?.category ? ` for ${pendingSubmission.category.name}` : ''}?`}
        onConfirm={handleConfirmSubmission}
        onCancel={handleCancelSubmission}
        confirmText="Add Entry"
        cancelText="Cancel"
      />
    </form>
  )
}