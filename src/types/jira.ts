export interface JiraTask {
  id: string
  key: string
  summary: string
  description?: string
  status?: string
  assignee?: string
  billingPackage?: string // customfield_10064
  timeTracking?: JiraTimeTracking
}

export interface JiraTimeTracking {
  originalEstimate?: string
  remainingEstimate?: string
  timeSpent?: string
  originalEstimateSeconds?: number
  remainingEstimateSeconds?: number
  timeSpentSeconds?: number
}

export interface JiraWorklog {
  id: string
  issueId: string
  author: {
    displayName: string
    emailAddress?: string
  }
  created: string
  started: string
  timeSpent: string
  timeSpentSeconds: number
  comment?: string
}

export interface JiraSearchResponse {
  issues: JiraIssue[]
  total: number
}

export interface JiraIssue {
  id: string
  key: string
  fields: {
    summary: string
    description?: string
    status?: {
      name: string
    }
    assignee?: {
      displayName: string
      emailAddress: string
    }
    customfield_10064?: any // billing package - can be string or object
    timetracking?: JiraTimeTracking
  }
}

export interface JiraConfig {
  baseUrl: string
  email: string
  apiToken: string
}