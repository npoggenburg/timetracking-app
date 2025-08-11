// Form Validation Service - Implements Single Responsibility and Open/Closed Principles

export interface ValidationResult {
  isValid: boolean
  errors: string[]
}

export interface ValidationRule<T> {
  validate(data: T): ValidationResult
}

export interface TimeEntryFormData {
  type: 'jira' | 'category'
  selectedJiraTask?: any
  selectedCategory?: any
  decimalHours: number
  date: string
  endDate?: string
}

// Base validation rules that can be extended (Open/Closed Principle)
export class RequiredJiraTaskRule implements ValidationRule<TimeEntryFormData> {
  validate(data: TimeEntryFormData): ValidationResult {
    if (data.type === 'jira' && !data.selectedJiraTask) {
      return {
        isValid: false,
        errors: ['Please select a JIRA task']
      }
    }
    return { isValid: true, errors: [] }
  }
}

export class RequiredCategoryRule implements ValidationRule<TimeEntryFormData> {
  validate(data: TimeEntryFormData): ValidationResult {
    if (data.type === 'category' && !data.selectedCategory) {
      return {
        isValid: false,
        errors: ['Please select a category']
      }
    }
    return { isValid: true, errors: [] }
  }
}

export class TimeBasedValidationRule implements ValidationRule<TimeEntryFormData> {
  validate(data: TimeEntryFormData): ValidationResult {
    const isDayBasedCategory = data.selectedCategory?.type === 'day'
    
    if (data.type === 'jira' || !isDayBasedCategory) {
      if (data.decimalHours <= 0) {
        return {
          isValid: false,
          errors: ['Please enter valid time']
        }
      }
    }
    return { isValid: true, errors: [] }
  }
}

export class DateValidationRule implements ValidationRule<TimeEntryFormData> {
  validate(data: TimeEntryFormData): ValidationResult {
    const isDayBasedCategory = data.selectedCategory?.type === 'day'
    
    if (data.type === 'category' && isDayBasedCategory && !data.date) {
      return {
        isValid: false,
        errors: ['Please select a date']
      }
    }
    return { isValid: true, errors: [] }
  }
}

// Validator that aggregates multiple rules
export class TimeEntryFormValidator {
  private rules: ValidationRule<TimeEntryFormData>[] = []

  constructor() {
    // Add default validation rules
    this.addRule(new RequiredJiraTaskRule())
    this.addRule(new RequiredCategoryRule())
    this.addRule(new TimeBasedValidationRule())
    this.addRule(new DateValidationRule())
  }

  // Open for extension - can add new rules without modifying existing code
  addRule(rule: ValidationRule<TimeEntryFormData>): void {
    this.rules.push(rule)
  }

  validate(data: TimeEntryFormData): ValidationResult {
    const allErrors: string[] = []
    let isValid = true

    for (const rule of this.rules) {
      const result = rule.validate(data)
      if (!result.isValid) {
        isValid = false
        allErrors.push(...result.errors)
      }
    }

    return {
      isValid,
      errors: allErrors
    }
  }
}

// Factory function
export const createFormValidator = (): TimeEntryFormValidator => {
  return new TimeEntryFormValidator()
}