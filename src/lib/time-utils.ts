// Date and Time Utilities
// Pure functions for date manipulation and time calculations

import type { DateRange, TimeRange } from '@/types/domain'

// Time conversion functions
export const roundToNearestQuarterHour = (hours: number): number => {
  // Round UP to the nearest 15-minute increment (like the original)
  const totalMinutes = hours * 60
  const roundedMinutes = Math.ceil(totalMinutes / 15) * 15
  return roundedMinutes / 60
}

export const hoursToDecimal = (timeString: string): number => {
  // Parse time strings like "2h30m", "1.5h", "90m", etc.
  const cleaned = timeString.toLowerCase().replace(/\s+/g, '')
  
  let totalHours = 0
  
  // Match hours (like "2h" or "2.5h")
  const hoursMatch = cleaned.match(/(\d+(?:\.\d+)?)h/)
  if (hoursMatch) {
    totalHours += parseFloat(hoursMatch[1])
  }
  
  // Match minutes (like "30m")
  const minutesMatch = cleaned.match(/(\d+(?:\.\d+)?)m/)
  if (minutesMatch) {
    totalHours += parseFloat(minutesMatch[1]) / 60
  }
  
  // If no h or m suffix, assume it's decimal hours
  if (!hoursMatch && !minutesMatch && /^\d+(?:\.\d+)?$/.test(cleaned)) {
    totalHours = parseFloat(cleaned)
  }
  
  return totalHours
}

export const formatDecimalHours = (decimalHours: number): string => {
  const hours = Math.floor(decimalHours)
  const minutes = Math.round((decimalHours - hours) * 60)
  
  if (hours === 0 && minutes === 0) {
    return '0h'
  }
  
  let result = ''
  if (hours > 0) {
    result += `${hours}h`
  }
  if (minutes > 0) {
    result += `${minutes}m`
  }
  
  return result
}

export const secondsToHours = (seconds: number): number => {
  return seconds / 3600
}

export const hoursToSeconds = (hours: number): number => {
  return hours * 3600
}

export const minutesToHours = (minutes: number): number => {
  return minutes / 60
}

// Date manipulation functions
export const today = (): Date => new Date()

export const todayString = (): string => 
  today().toISOString().split('T')[0]

export const startOfMonth = (date: Date): Date => 
  new Date(date.getFullYear(), date.getMonth(), 1)

export const endOfMonth = (date: Date): Date => 
  new Date(date.getFullYear(), date.getMonth() + 1, 0)

export const startOfWeek = (date: Date, startOfWeek = 0): Date => {
  const result = new Date(date)
  const day = result.getDay()
  const diff = (day < startOfWeek ? 7 : 0) + day - startOfWeek
  result.setDate(result.getDate() - diff)
  return result
}

export const addDays = (date: Date, days: number): Date => {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

export const addMonths = (date: Date, months: number): Date => {
  const result = new Date(date)
  result.setMonth(result.getMonth() + months)
  return result
}

export const isWeekend = (date: Date): boolean => {
  const day = date.getDay()
  return day === 0 || day === 6
}

export const isSameDay = (date1: Date, date2: Date): boolean => 
  date1.toDateString() === date2.toDateString()

export const isToday = (date: Date): boolean => 
  isSameDay(date, today())

export const isFuture = (date: Date): boolean => 
  date > today()

export const isPast = (date: Date): boolean => 
  date < today()

// Date range functions
export const createDateRange = (start: string, end: string): DateRange => ({
  startDate: start,
  endDate: end
})

export const getMonthDateRange = (date: Date): DateRange => {
  const start = startOfMonth(date)
  const end = endOfMonth(date)
  return {
    startDate: start.toISOString().split('T')[0],
    endDate: end.toISOString().split('T')[0]
  }
}

export const getWeekDateRange = (date: Date): DateRange => {
  const start = startOfWeek(date, 1) // Monday as start of week
  const end = addDays(start, 6)
  return {
    startDate: start.toISOString().split('T')[0],
    endDate: end.toISOString().split('T')[0]
  }
}

export const getDaysInRange = (range: DateRange): Date[] => {
  const days: Date[] = []
  const start = new Date(range.startDate)
  const end = new Date(range.endDate)
  
  const current = new Date(start)
  while (current <= end) {
    days.push(new Date(current))
    current.setDate(current.getDate() + 1)
  }
  
  return days
}

// Working days calculations
export const getWorkingDaysInMonth = (date: Date): number => {
  const range = getMonthDateRange(date)
  const days = getDaysInRange(range)
  return days.filter(day => !isWeekend(day) && !isFuture(day)).length
}

export const getWorkingDaysInRange = (range: DateRange): number => {
  const days = getDaysInRange(range)
  return days.filter(day => !isWeekend(day)).length
}

// Time calculations
export const calculateTotalHours = (entries: Array<{ hours?: number | null }>): number => 
  entries.reduce((sum, entry) => sum + (entry.hours || 0), 0)

export const calculateAverageHoursPerDay = (totalHours: number, days: number): number => 
  days > 0 ? totalHours / days : 0

// Date string utilities
export const parseLocalDate = (dateString: string): Date => {
  const [year, month, day] = dateString.split('-').map(Number)
  return new Date(year, month - 1, day)
}

export const toLocalDateString = (date: Date): string => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// Calendar utilities
export const getCalendarWeeks = (date: Date): Date[][] => {
  const start = startOfMonth(date)
  const end = endOfMonth(date)
  const calendarStart = startOfWeek(start, 0) // Sunday as start
  const calendarEnd = addDays(endOfMonth(end), 6 - endOfMonth(end).getDay())
  
  const weeks: Date[][] = []
  let currentWeek: Date[] = []
  
  const current = new Date(calendarStart)
  while (current <= calendarEnd) {
    currentWeek.push(new Date(current))
    
    if (current.getDay() === 6) { // Saturday
      weeks.push(currentWeek)
      currentWeek = []
    }
    
    current.setDate(current.getDate() + 1)
  }
  
  return weeks
}