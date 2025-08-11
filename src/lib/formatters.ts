// Formatting Utilities
// Pure functions for consistent data formatting across the app

import type { Maybe } from './functional'

// Time formatting functions
export const formatSeconds = (seconds: Maybe<number>): string => {
  if (!seconds || seconds <= 0) return '-'
  
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

export const formatHours = (hours: Maybe<number>): string => {
  if (!hours || hours <= 0) return '-'
  
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

export const formatTime = (hours: Maybe<number>, showZero = false): string => {
  if (!hours && !showZero) return '-'
  return formatHours(hours || 0)
}

// Date formatting functions
export const formatDate = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

export const formatShortDate = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  })
}

export const formatMonthYear = (date: Date): string => {
  return date.toLocaleDateString('en-US', { 
    month: 'long', 
    year: 'numeric' 
  })
}

export const formatDateInput = (date: Date): string => {
  return date.toISOString().split('T')[0]
}

// JIRA key formatting
export const formatJiraKey = (key: Maybe<string>): string => {
  if (!key) return '-'
  return key.toUpperCase()
}

// Currency/billing formatting
export const formatBillingPackage = (pkg: Maybe<string>): string => {
  if (!pkg) return '-'
  return pkg.trim()
}

// Status formatting
export const formatEntryCount = (count: number): string => {
  return `${count} ${count === 1 ? 'entry' : 'entries'}`
}

// Text utilities
export const truncate = (text: string, length: number): string => {
  if (text.length <= length) return text
  return text.slice(0, length).trim() + '...'
}

export const capitalize = (text: string): string => {
  if (!text) return ''
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase()
}

// Number formatting
export const formatNumber = (num: Maybe<number>, decimals = 0): string => {
  if (num === null || num === undefined) return '-'
  return num.toFixed(decimals)
}

export const formatPercentage = (value: number, total: number): string => {
  if (total === 0) return '0%'
  const percentage = (value / total) * 100
  return `${Math.round(percentage)}%`
}

// Validation helpers (pure functions)
export const isValidTimeInput = (input: string): boolean => {
  const timeRegex = /^(\d+(?:\.\d+)?h?(?:\s*\d+(?:\.\d+)?m?)?|\d+(?:\.\d+)?m?)$/i
  return timeRegex.test(input.trim())
}

export const isValidJiraKey = (key: string): boolean => {
  const jiraKeyPattern = /^[A-Z]+[A-Z0-9]*-\d+$/
  return jiraKeyPattern.test(key.toUpperCase())
}

export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Color utilities
export const hexToRgba = (hex: string, alpha = 1): string => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!result) return `rgba(0, 0, 0, ${alpha})`
  
  const r = parseInt(result[1], 16)
  const g = parseInt(result[2], 16)
  const b = parseInt(result[3], 16)
  
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

export const getContrastColor = (hexColor: string): 'light' | 'dark' => {
  const hex = hexColor.replace('#', '')
  const r = parseInt(hex.substr(0, 2), 16)
  const g = parseInt(hex.substr(2, 2), 16)
  const b = parseInt(hex.substr(4, 2), 16)
  
  // Calculate brightness
  const brightness = (r * 299 + g * 587 + b * 114) / 1000
  return brightness > 128 ? 'dark' : 'light'
}