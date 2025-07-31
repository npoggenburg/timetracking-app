'use client'

import { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, Search, ChevronDown } from 'lucide-react'

interface Category {
  id: string
  name: string
  description?: string
  color?: string
  type?: string
}

interface CategorySelectorProps {
  onCategorySelect: (category: Category) => void
  selectedCategory?: Category | null
  onCategoriesLoaded?: () => void
}

export interface CategorySelectorRef {
  focus: () => void
}

export const CategorySelector = forwardRef<CategorySelectorRef, CategorySelectorProps>(({ onCategorySelect, selectedCategory, onCategoriesLoaded }, ref) => {
  const [categories, setCategories] = useState<Category[]>([])
  const [filteredCategories, setFilteredCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)

  useImperativeHandle(ref, () => ({
    focus: () => {
      inputRef.current?.focus()
    }
  }))

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setIsLoading(true)
        const response = await fetch('/api/categories')
        
        if (!response.ok) {
          throw new Error('Failed to fetch categories')
        }
        
        const data = await response.json()
        setCategories(data)
        setFilteredCategories(data) // Show all by default
      } catch (error) {
        console.error('Error fetching categories:', error)
        setError('Failed to load categories')
      } finally {
        setIsLoading(false)
        // Call the callback after categories are loaded and component is ready
        if (onCategoriesLoaded) {
          setTimeout(() => {
            onCategoriesLoaded()
          }, 50) // Small delay to ensure DOM is updated
        }
      }
    }

    fetchCategories()
  }, [])

  // Filter categories based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredCategories(categories)
    } else {
      const filtered = categories.filter(category => 
        category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (category.description && category.description.toLowerCase().includes(searchQuery.toLowerCase()))
      )
      setFilteredCategories(filtered)
    }
    setSelectedIndex(-1) // Reset selection when filtering
  }, [searchQuery, categories])

  const handleCategorySelect = (category: Category) => {
    onCategorySelect(category)
    setSearchQuery(`${category.name}`)
    setIsDropdownOpen(false)
    setSelectedIndex(-1)
  }

  const handleInputFocus = () => {
    if (categories.length > 0) {
      setIsDropdownOpen(true)
    }
  }

  const handleInputBlur = () => {
    // Delay hiding dropdown to allow for clicks
    setTimeout(() => setIsDropdownOpen(false), 200)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
    setIsDropdownOpen(true)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isDropdownOpen || filteredCategories.length === 0) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev => 
          prev < filteredCategories.length - 1 ? prev + 1 : 0
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : filteredCategories.length - 1
        )
        break
      case 'Enter':
        e.preventDefault()
        if (selectedIndex >= 0 && selectedIndex < filteredCategories.length) {
          handleCategorySelect(filteredCategories[selectedIndex])
        } else if (filteredCategories.length === 1) {
          // Auto-select the only result when there's just one
          handleCategorySelect(filteredCategories[0])
        }
        break
      case 'Escape':
        e.preventDefault()
        setIsDropdownOpen(false)
        setSelectedIndex(-1)
        break
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Label className="text-base font-semibold">Select Activity Type</Label>
        <div className="flex items-center justify-center p-8 border rounded-md">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="ml-2">Loading categories...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-2">
        <Label className="text-base font-semibold">Select Activity Type</Label>
        <div className="rounded-md border border-destructive bg-destructive/10 p-4 text-center">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      </div>
    )
  }

  if (categories.length === 0) {
    return (
      <div className="space-y-2">
        <Label className="text-base font-semibold">Select Activity Type</Label>
        <div className="rounded-md border border-muted bg-muted/50 p-4 text-center">
          <p className="text-sm text-muted-foreground">No categories available</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <Label className="text-base font-semibold">Select Activity Type</Label>
      
      <div className="relative w-full">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            ref={inputRef}
            type="text"
            placeholder="Search or select activity type..."
            value={searchQuery}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
            className="pl-10 pr-10"
          />
          <ChevronDown className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        </div>

        {isDropdownOpen && (
          <div className="absolute top-full z-50 mt-1 w-full rounded-md border bg-background shadow-lg">
            <div className="max-h-60 overflow-auto">
              {filteredCategories.length > 0 ? (
                filteredCategories.map((category, index) => (
                  <button
                    key={category.id}
                    onClick={() => handleCategorySelect(category)}
                    className={`w-full border-b border-border px-4 py-3 text-left hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none last:border-b-0 ${
                      index === selectedIndex ? 'bg-accent text-accent-foreground' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="h-4 w-4 rounded-full flex-shrink-0"
                        style={{ backgroundColor: category.color || '#6b7280' }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm">{category.name}</div>
                        {category.description && (
                          <div className="text-xs text-muted-foreground mt-1 truncate">
                            {category.description}
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                ))
              ) : (
                <div className="px-4 py-3 text-center text-sm text-muted-foreground">
                  No categories found for "{searchQuery}"
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {selectedCategory && (
        <div className="mt-4 rounded-md border border-border bg-muted/50 p-3">
          <div className="flex items-center gap-2">
            <div
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: selectedCategory.color || '#6b7280' }}
            />
            <span className="font-medium">{selectedCategory.name}</span>
          </div>
          {selectedCategory.description && (
            <p className="mt-1 text-sm text-muted-foreground">
              {selectedCategory.description}
            </p>
          )}
        </div>
      )}
    </div>
  )
})

CategorySelector.displayName = 'CategorySelector'