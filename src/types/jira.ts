export interface JiraTask {
  id: string
  key: string
  summary: string
  description?: string
  status?: string
  assignee?: string
  billingPackage?: string // customfield_10064
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
    customfield_10064?: string // billing package
  }
}

export interface JiraConfig {
  baseUrl: string
  email: string
  apiToken: string
}