// Loading Components
// Composable loading states following composition-first design

import { cn } from '@/lib/utils'

// Basic spinner component
export interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export const Spinner = ({ size = 'md', className }: SpinnerProps) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8', 
    lg: 'h-12 w-12'
  }

  return (
    <div
      className={cn(
        'animate-spin rounded-full border-b-2 border-blue-600',
        sizeClasses[size],
        className
      )}
    />
  )
}

// Section loading component
export interface SectionLoadingProps {
  message: string
  className?: string
}

export const SectionLoading = ({ message, className }: SectionLoadingProps) => (
  <div className={cn('bg-white border rounded-lg p-8', className)}>
    <div className="flex items-center justify-center">
      <div className="text-center">
        <Spinner size="md" className="mx-auto" />
        <p className="mt-3 text-sm text-gray-600">{message}</p>
      </div>
    </div>
  </div>
)

// Page loading component
export interface PageLoadingProps {
  message?: string
  className?: string
}

export const PageLoading = ({ 
  message = 'Loading...', 
  className 
}: PageLoadingProps) => (
  <div className={cn('flex items-center justify-center h-64', className)}>
    <div className="text-center">
      <Spinner size="lg" className="mx-auto" />
      <p className="mt-4 text-gray-600">{message}</p>
    </div>
  </div>
)

// Skeleton loading components
export interface SkeletonProps {
  className?: string
  width?: string
  height?: string
}

export const Skeleton = ({ className, width, height }: SkeletonProps) => (
  <div
    className={cn('animate-pulse bg-gray-200 rounded', className)}
    style={{ width, height }}
  />
)

// Skeleton text lines
export const SkeletonText = ({ lines = 1 }: { lines?: number }) => (
  <div className="space-y-2">
    {Array.from({ length: lines }, (_, i) => (
      <Skeleton 
        key={i} 
        className="h-4" 
        width={i === lines - 1 ? '75%' : '100%'} 
      />
    ))}
  </div>
)

// Table skeleton
export const TableSkeleton = ({ 
  rows = 3, 
  cols = 4 
}: { 
  rows?: number
  cols?: number 
}) => (
  <div className="bg-white border rounded-lg overflow-hidden">
    <div className="bg-gray-50 border-b">
      <div className="flex">
        {Array.from({ length: cols }, (_, i) => (
          <div key={i} className="flex-1 p-4">
            <Skeleton className="h-4" />
          </div>
        ))}
      </div>
    </div>
    <div>
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex border-b last:border-b-0">
          {Array.from({ length: cols }, (_, j) => (
            <div key={j} className="flex-1 p-4">
              <Skeleton className="h-4" />
            </div>
          ))}
        </div>
      ))}
    </div>
  </div>
)

// Loading button
export interface LoadingButtonProps {
  isLoading: boolean
  children: React.ReactNode
  loadingText?: string
  disabled?: boolean
  onClick?: () => void
  className?: string
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
}

export const LoadingButton = ({
  isLoading,
  children,
  loadingText = 'Loading...',
  disabled,
  onClick,
  className,
  ...props
}: LoadingButtonProps) => (
  <button
    onClick={onClick}
    disabled={disabled || isLoading}
    className={cn(
      'inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md font-medium transition-colors',
      'disabled:opacity-50 disabled:cursor-not-allowed',
      'bg-blue-600 text-white hover:bg-blue-700',
      className
    )}
    {...props}
  >
    {isLoading && <Spinner size="sm" />}
    {isLoading ? loadingText : children}
  </button>
)

// Higher-order component for loading states
export interface WithLoadingProps {
  isLoading: boolean
  loadingComponent?: React.ReactNode
  children: React.ReactNode
}

export const WithLoading = ({ 
  isLoading, 
  loadingComponent = <PageLoading />, 
  children 
}: WithLoadingProps) => {
  return isLoading ? <>{loadingComponent}</> : <>{children}</>
}

// Composable loading hook
export interface UseLoadingOptions {
  initialState?: boolean
  delay?: number
}

export const useLoading = (options: UseLoadingOptions = {}) => {
  const { initialState = false, delay = 0 } = options
  const [isLoading, setIsLoading] = React.useState(initialState)

  const startLoading = React.useCallback(() => {
    if (delay > 0) {
      setTimeout(() => setIsLoading(true), delay)
    } else {
      setIsLoading(true)
    }
  }, [delay])

  const stopLoading = React.useCallback(() => {
    setIsLoading(false)
  }, [])

  const withLoading = React.useCallback(async <T>(
    asyncFn: () => Promise<T>
  ): Promise<T> => {
    startLoading()
    try {
      return await asyncFn()
    } finally {
      stopLoading()
    }
  }, [startLoading, stopLoading])

  return {
    isLoading,
    startLoading,
    stopLoading,
    withLoading
  }
}

// React import for the hook
import React from 'react'