'use client'

import { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react'
import { Search, Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { jiraClientService } from '@/services/jira-client.service'
import { JiraTask } from '@/types/jira'

interface JiraSearchProps {
  onTaskSelect: (task: JiraTask) => void
  placeholder?: string
}

export interface JiraSearchRef {
  focus: () => void
}

export const JiraSearch = forwardRef<JiraSearchRef, JiraSearchProps>(({ onTaskSelect, placeholder = "Search JIRA tasks..." }, ref) => {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<JiraTask[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [isTaskSelected, setIsTaskSelected] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)

  useImperativeHandle(ref, () => ({
    focus: () => {
      inputRef.current?.focus()
    }
  }))

  useEffect(() => {
    const searchTasks = async () => {
      // Skip search if a task was just selected
      if (isTaskSelected) {
        return // Don't reset the flag here, let the input change handler do it
      }

      if (query.length < 2) {
        setResults([])
        setShowResults(false)
        setSelectedIndex(-1)
        return
      }

      setIsLoading(true)
      try {
        const tasks = await jiraClientService.searchTasks(query)
        setResults(tasks)
        setShowResults(true)
        setSelectedIndex(-1)
      } catch (error) {
        console.error('Error searching JIRA tasks:', error)
        setResults([])
        setSelectedIndex(-1)
      } finally {
        setIsLoading(false)
      }
    }

    const debounceTimer = setTimeout(searchTasks, 300)
    return () => clearTimeout(debounceTimer)
  }, [query, isTaskSelected])

  const handleTaskSelect = (task: JiraTask) => {
    onTaskSelect(task)
    setIsTaskSelected(true) // Flag to prevent search on the selected text
    setQuery(task.key) // Only show the task key (e.g., "PROJ-123")
    setShowResults(false)
    setSelectedIndex(-1)
  }

  const handleInputFocus = () => {
    if (results.length > 0) {
      setShowResults(true)
    }
  }

  const handleInputBlur = () => {
    // Delay hiding results to allow for clicks
    setTimeout(() => setShowResults(false), 200)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setQuery(newValue)
    
    // Reset the task selected flag when user actually types (not programmatic change)
    if (isTaskSelected && e.nativeEvent.inputType) {
      // Only reset if this was a real user input event (has inputType)
      setIsTaskSelected(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showResults || results.length === 0) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev => 
          prev < results.length - 1 ? prev + 1 : 0
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : results.length - 1
        )
        break
      case 'Enter':
        e.preventDefault()
        if (selectedIndex >= 0 && selectedIndex < results.length) {
          handleTaskSelect(results[selectedIndex])
        } else if (results.length === 1) {
          // Auto-select the only result when there's just one
          handleTaskSelect(results[0])
        }
        break
      case 'Escape':
        e.preventDefault()
        setShowResults(false)
        setSelectedIndex(-1)
        break
    }
  }

  return (
    <div className="relative w-full">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          className="pl-10 pr-10"
        />
        {isLoading && (
          <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
        )}
      </div>

      {showResults && results.length > 0 && (
        <div className="absolute top-full z-50 mt-1 w-full rounded-md border bg-background shadow-lg">
          <div className="max-h-60 overflow-auto">
            {results.map((task, index) => (
              <button
                key={task.id}
                onClick={() => handleTaskSelect(task)}
                className={`w-full border-b border-border px-4 py-3 text-left text-sm hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none last:border-b-0 ${
                  index === selectedIndex ? 'bg-accent text-accent-foreground' : ''
                }`}
              >
                <div className="font-medium">{task.key}</div>
                <div className="text-muted-foreground">{task.summary}</div>
                {task.billingPackage && (
                  <div className="text-xs text-blue-600 mt-1">
                    {task.billingPackage}
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {showResults && results.length === 0 && query.length >= 2 && !isLoading && (
        <div className="absolute top-full z-50 mt-1 w-full rounded-md border bg-background p-4 text-center text-sm text-muted-foreground shadow-lg">
          No tasks found for "{query}"
        </div>
      )}
    </div>
  )
})

JiraSearch.displayName = 'JiraSearch'