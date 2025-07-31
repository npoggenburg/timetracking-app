'use client'

import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

interface DateRangeInputProps {
  startDate: string
  endDate: string
  onStartDateChange: (date: string) => void
  onEndDateChange: (date: string) => void
  className?: string
  required?: boolean
  singleDay?: boolean // For sick leave that might be single day
}

export function DateRangeInput({ 
  startDate, 
  endDate, 
  onStartDateChange, 
  onEndDateChange, 
  className, 
  required,
  singleDay = false 
}: DateRangeInputProps) {
  const [showEndDate, setShowEndDate] = useState(!singleDay)
  const [dayCount, setDayCount] = useState<number>(0)

  // Calculate number of days when both dates are set
  useEffect(() => {
    if (startDate && (endDate || singleDay)) {
      const start = new Date(startDate)
      const end = endDate ? new Date(endDate) : start
      
      if (start <= end) {
        const timeDiff = end.getTime() - start.getTime()
        const days = Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1 // +1 to include both start and end day
        setDayCount(days)
      } else {
        setDayCount(0)
      }
    } else {
      setDayCount(0)
    }
  }, [startDate, endDate, singleDay])

  // Auto-set end date to start date for single day entries
  useEffect(() => {
    if (singleDay && startDate && !endDate) {
      onEndDateChange(startDate)
    }
  }, [singleDay, startDate, endDate, onEndDateChange])

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newStartDate = e.target.value
    onStartDateChange(newStartDate)
    
    // If single day mode, also update end date
    if (singleDay) {
      onEndDateChange(newStartDate)
    }
    
    // If end date is before start date, reset it
    if (endDate && newStartDate && new Date(newStartDate) > new Date(endDate)) {
      onEndDateChange('')
    }
  }

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onEndDateChange(e.target.value)
  }

  const toggleMultipleDays = () => {
    setShowEndDate(!showEndDate)
    if (showEndDate) {
      // Switching to single day - set end date to start date
      onEndDateChange(startDate)
    } else {
      // Switching to multiple days - clear end date so user can set it
      onEndDateChange('')
    }
  }

  return (
    <div className={cn("space-y-3", className)}>
      {/* Single/Multiple Day Toggle for flexible categories */}
      {singleDay === false && (
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="multiple-days"
            checked={showEndDate}
            onChange={toggleMultipleDays}
            className="h-4 w-4 rounded border-gray-300"
          />
          <Label htmlFor="multiple-days" className="text-sm">
            Multiple days
          </Label>
        </div>
      )}

      {/* Start Date */}
      <div className="space-y-1">
        <Label htmlFor="start-date">
          {showEndDate && !singleDay ? 'Start Date *' : 'Date *'}
        </Label>
        <Input
          id="start-date"
          type="date"
          value={startDate}
          onChange={handleStartDateChange}
          required={required}
          max="2030-12-31"
        />
      </div>

      {/* End Date - only show if multiple days selected */}
      {showEndDate && !singleDay && (
        <div className="space-y-1">
          <Label htmlFor="end-date">End Date *</Label>
          <Input
            id="end-date"
            type="date"
            value={endDate}
            onChange={handleEndDateChange}
            min={startDate || undefined}
            max="2030-12-31"
            required={required && showEndDate}
          />
        </div>
      )}

      {/* Day count display */}
      {dayCount > 0 && (
        <div className="text-sm text-muted-foreground bg-blue-50 border border-blue-200 rounded px-2 py-1">
          📅 Total: <strong>{dayCount} day{dayCount > 1 ? 's' : ''}</strong>
          {dayCount > 1 && ` (${startDate} to ${endDate})`}
        </div>
      )}

      {/* Validation message */}
      {startDate && endDate && new Date(startDate) > new Date(endDate) && (
        <p className="text-xs text-destructive">
          End date must be after or equal to start date
        </p>
      )}
    </div>
  )
}