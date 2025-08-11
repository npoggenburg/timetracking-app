// Zod Validation Schemas
// Type-safe validation following strong typing principles

import { z } from 'zod'

// Base schemas
export const IdSchema = z.string().min(1, 'ID is required')

export const DateSchema = z.string().regex(
  /^\d{4}-\d{2}-\d{2}$/,
  'Date must be in YYYY-MM-DD format'
)

export const TimeStringSchema = z.string().regex(
  /^(\d+(?:\.\d+)?h?(?:\s*\d+(?:\.\d+)?m?)?|\d+(?:\.\d+)?m?)$/i,
  'Invalid time format. Use formats like "2h30m", "1.5h", or "90m"'
)

export const HoursSchema = z.number().min(0, 'Hours must be non-negative').max(24, 'Hours cannot exceed 24')

export const ColorSchema = z.string().regex(/^#[0-9A-F]{6}$/i, 'Color must be a valid hex code')

// Domain object schemas
export const CategoryTypeSchema = z.enum(['time', 'day'])

export const CategorySchema = z.object({
  id: IdSchema,
  name: z.string().min(1, 'Category name is required').max(100, 'Category name too long'),
  description: z.string().max(500, 'Description too long').optional(),
  color: ColorSchema.optional(),
  type: CategoryTypeSchema.optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional()
})

export const TimeEntrySchema = z.object({
  id: IdSchema,
  date: DateSchema,
  hours: HoursSchema.nullable().optional(),
  jiraKey: z.string().optional().nullable(),
  jiraBillingPackage: z.string().optional().nullable(),
  categoryId: IdSchema.optional().nullable(),
  category: CategorySchema.optional().nullable(),
  description: z.string().max(1000, 'Description too long').optional().nullable(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional()
})

export const DailyWorkTimeSchema = z.object({
  id: IdSchema.optional(),
  date: DateSchema,
  totalHours: HoursSchema,
  createdAt: z.string().optional(),
  updatedAt: z.string().optional()
})

// Form validation schemas
export const CreateTimeEntryFormSchema = z.object({
  type: z.enum(['jira', 'category'], {
    required_error: 'Entry type is required'
  }),
  jiraTask: z.object({
    key: z.string().min(1, 'JIRA key is required'),
    summary: z.string().optional(),
    billingPackage: z.string().optional()
  }).optional(),
  category: z.object({
    id: IdSchema
  }).optional(),
  hours: HoursSchema.optional(),
  date: DateSchema,
  endDate: DateSchema.optional(),
  description: z.string().max(1000, 'Description too long').optional()
}).superRefine((data, ctx) => {
  // Custom validation logic
  if (data.type === 'jira') {
    if (!data.jiraTask) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['jiraTask'],
        message: 'JIRA task is required for JIRA entries'
      })
    }
    if (!data.hours) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['hours'],
        message: 'Hours are required for JIRA entries'
      })
    }
  }
  
  if (data.type === 'category') {
    if (!data.category) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['category'],
        message: 'Category is required for category entries'
      })
    }
  }
})

export const UpdateTimeEntryFormSchema = CreateTimeEntryFormSchema.partial().extend({
  id: IdSchema
})

export const CreateCategoryFormSchema = z.object({
  name: z.string().min(1, 'Category name is required').max(100, 'Category name too long'),
  description: z.string().max(500, 'Description too long').optional(),
  color: ColorSchema.optional(),
  type: CategoryTypeSchema.optional()
})

export const UpdateCategoryFormSchema = CreateCategoryFormSchema.partial().extend({
  id: IdSchema
})

export const DailyWorkTimeFormSchema = z.object({
  date: DateSchema,
  totalHours: HoursSchema
})

// Query parameter schemas
export const TimeEntriesQuerySchema = z.object({
  date: DateSchema.optional(),
  startDate: DateSchema.optional(),
  endDate: DateSchema.optional(),
  categoryId: IdSchema.optional(),
  jiraKey: z.string().optional()
}).refine((data) => {
  // Either use date OR startDate/endDate, not both
  if (data.date && (data.startDate || data.endDate)) {
    return false
  }
  // If using date range, both startDate and endDate are required
  if (data.startDate && !data.endDate) return false
  if (data.endDate && !data.startDate) return false
  return true
}, {
  message: 'Use either date or startDate/endDate, not both. Date ranges require both startDate and endDate.'
})

export const JiraSearchQuerySchema = z.object({
  query: z.string().min(1, 'Search query is required'),
  limit: z.number().int().min(1).max(100).optional()
})

export const JiraWorklogsQuerySchema = z.object({
  date: DateSchema,
  author: z.string().optional()
})

// API Response schemas
export const ApiErrorSchema = z.object({
  error: z.string(),
  message: z.string().optional(),
  code: z.number().optional()
})

export const ApiSuccessSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    data: dataSchema,
    message: z.string().optional()
  })

// JIRA schemas
export const JiraTimeTrackingSchema = z.object({
  originalEstimate: z.string().optional(),
  remainingEstimate: z.string().optional(),
  timeSpent: z.string().optional(),
  originalEstimateSeconds: z.number().optional(),
  remainingEstimateSeconds: z.number().optional(),
  timeSpentSeconds: z.number().optional()
})

export const JiraTaskSchema = z.object({
  id: z.string(),
  key: z.string(),
  summary: z.string(),
  description: z.string().optional(),
  status: z.string().optional(),
  assignee: z.string().optional(),
  billingPackage: z.string().optional().nullable(),
  timeTracking: JiraTimeTrackingSchema.optional()
})

export const JiraWorklogSchema = z.object({
  id: z.string(),
  issueId: z.string(),
  author: z.object({
    displayName: z.string(),
    emailAddress: z.string().optional()
  }),
  created: z.string(),
  started: z.string(),
  timeSpent: z.string(),
  timeSpentSeconds: z.number(),
  comment: z.string().optional()
})

// Type inference from schemas
export type Category = z.infer<typeof CategorySchema>
export type TimeEntry = z.infer<typeof TimeEntrySchema>
export type DailyWorkTime = z.infer<typeof DailyWorkTimeSchema>
export type CreateTimeEntryForm = z.infer<typeof CreateTimeEntryFormSchema>
export type UpdateTimeEntryForm = z.infer<typeof UpdateTimeEntryFormSchema>
export type CreateCategoryForm = z.infer<typeof CreateCategoryFormSchema>
export type UpdateCategoryForm = z.infer<typeof UpdateCategoryFormSchema>
export type TimeEntriesQuery = z.infer<typeof TimeEntriesQuerySchema>
export type JiraTask = z.infer<typeof JiraTaskSchema>
export type JiraWorklog = z.infer<typeof JiraWorklogSchema>

// Validation helper functions
export const validateTimeEntry = (data: unknown) => TimeEntrySchema.safeParse(data)
export const validateCategory = (data: unknown) => CategorySchema.safeParse(data)
export const validateCreateTimeEntryForm = (data: unknown) => CreateTimeEntryFormSchema.safeParse(data)
export const validateTimeEntriesQuery = (data: unknown) => TimeEntriesQuerySchema.safeParse(data)

// Error formatting helper
export const formatZodError = (error: z.ZodError) => {
  return error.errors.map(err => ({
    field: err.path.join('.'),
    message: err.message
  }))
}

// Safe parsing with better error handling
export const safeParseWithDetails = <T extends z.ZodTypeAny>(
  schema: T,
  data: unknown
): { success: true; data: z.infer<T> } | { success: false; errors: Array<{ field: string; message: string }> } => {
  const result = schema.safeParse(data)
  
  if (result.success) {
    return { success: true, data: result.data }
  }
  
  return {
    success: false,
    errors: formatZodError(result.error)
  }
}