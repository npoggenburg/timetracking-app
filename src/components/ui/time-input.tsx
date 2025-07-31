'use client'

import { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { roundToNearestQuarterHour, formatDecimalHours } from '@/lib/time-utils'

interface TimeInputProps {
  value: string
  onChange: (value: string, decimalHours: number) => void
  placeholder?: string
  className?: string
  required?: boolean
}

export interface TimeInputRef {
  focus: () => void
  reset: () => void
}

interface ParsedTime {
  hours: number
  minutes: number
  isValid: boolean
  originalInput: string
  roundedInput: string
  decimalHours: number
}

function parseTimeInput(input: string): ParsedTime {
  const result: ParsedTime = {
    hours: 0,
    minutes: 0,
    isValid: false,
    originalInput: input,
    roundedInput: '',
    decimalHours: 0
  }

  if (!input.trim()) {
    return result
  }

  // Match patterns like: 2h30m, 2h, 30m - must have at least one time unit
  const timeRegex = /^(?:(\d+)h(?:(\d+)m)?|(\d+)m)$/i
  const match = input.toLowerCase().replace(/\s/g, '').match(timeRegex)

  if (!match) {
    return result
  }

  const hoursStr = match[1] // Hours from "Xh..." pattern
  const minutesFromHours = match[2] // Minutes from "XhYm" pattern  
  const minutesOnly = match[3] // Minutes from "Xm" only pattern

  // Parse hours and minutes
  const hours = hoursStr ? parseInt(hoursStr, 10) : 0
  const minutes = minutesFromHours ? parseInt(minutesFromHours, 10) : 
                  minutesOnly ? parseInt(minutesOnly, 10) : 0

  // Validate ranges
  if (hours < 0 || hours > 24 || minutes < 0 || minutes > 59) {
    return result
  }

  // Must have at least one time unit specified
  if (hours === 0 && minutes === 0) {
    return result
  }

  result.hours = hours
  result.minutes = minutes
  result.isValid = true
  result.roundedInput = input // No rounding, return original input
  result.decimalHours = hours + (minutes / 60)

  return result
}

export const TimeInput = forwardRef<TimeInputRef, TimeInputProps>(({ value, onChange, placeholder = "e.g., 2h30m", className, required }, ref) => {
  const [inputValue, setInputValue] = useState(value)
  const [parsedTime, setParsedTime] = useState<ParsedTime | null>(null)
  const [roundingInfo, setRoundingInfo] = useState<{ willRound: boolean; roundedDisplay: string } | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Sync internal state with prop value when it changes externally
  useEffect(() => {
    setInputValue(value)
  }, [value])

  useImperativeHandle(ref, () => ({
    focus: () => {
      inputRef.current?.focus()
    },
    reset: () => {
      setInputValue('')
    }
  }))

  useEffect(() => {
    const parsed = parseTimeInput(inputValue)
    setParsedTime(parsed)

    // Calculate rounding info for valid inputs
    if (parsed.isValid) {
      const roundedDecimal = roundToNearestQuarterHour(parsed.decimalHours)
      const willRound = Math.abs(roundedDecimal - parsed.decimalHours) > 0.001 // Account for floating point precision
      const roundedDisplay = formatDecimalHours(roundedDecimal)
      
      setRoundingInfo({
        willRound,
        roundedDisplay
      })

      onChange(parsed.roundedInput, parsed.decimalHours)
    } else {
      setRoundingInfo(null)
    }
    // For invalid input, don't call onChange at all - let user keep typing
  }, [inputValue, onChange])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value)
  }

  return (
    <div className="space-y-2">
      <Input
        ref={inputRef}
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        placeholder={placeholder}
        className={cn(
          className,
          !parsedTime?.isValid && inputValue.trim() && "border-destructive"
        )}
        required={required}
      />
      
      {/* Validation Error */}
      {inputValue.trim() && !parsedTime?.isValid && (
        <p className="text-xs text-destructive">
          Invalid format. Must include time unit: 2h30m, 1h, or 45m (numbers alone like "5" are not valid)
        </p>
      )}
      
      {/* Rounding Info */}
      {roundingInfo?.willRound && (
        <p className="text-xs text-blue-600 bg-blue-50 border border-blue-200 rounded px-2 py-1">
          ⏰ Will be rounded up to <strong>{roundingInfo.roundedDisplay}</strong> on save
        </p>
      )}
      
      {/* Format Help */}
      {!inputValue.trim() && (
        <p className="text-xs text-muted-foreground">
          Format: 2h30m (hours + minutes), 2h (hours only), or 30m (minutes only). Minutes will be rounded up to 15-minute intervals on save.
        </p>
      )}
    </div>
  )
})

TimeInput.displayName = 'TimeInput'