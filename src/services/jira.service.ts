import { JiraTask, JiraSearchResponse, JiraIssue, JiraWorklog } from '@/types/jira'

export class JiraService {
  private baseUrl: string
  private email: string
  private apiToken: string

  constructor() {
    this.baseUrl = process.env.JIRA_BASE_URL || ''
    this.email = process.env.JIRA_EMAIL || ''
    this.apiToken = process.env.JIRA_API_TOKEN || ''

    if (!this.baseUrl || !this.email || !this.apiToken) {
      console.warn('JIRA credentials not found in environment variables')
    }
  }

  private getAuthHeader(): string {
    return `Basic ${btoa(`${this.email}:${this.apiToken}`)}`
  }

  /**
   * Search for JIRA tasks by key or text
   * @param query - Search term (task key or text)
   * @returns Promise<JiraTask[]>
   */
  async searchTasks(query: string): Promise<JiraTask[]> {
    if (!query.trim()) {
      return []
    }

    try {
      // Build JQL query - search within MFLP project for the query
      const jql = encodeURIComponent(`project IN (TN,CON,MFLP) AND (key="${query.toUpperCase()}" OR summary~"${query}" OR key~"${query.toUpperCase()}")`)
      const url = `${this.baseUrl}/rest/api/3/search/jql?jql=${jql}&fields=id,key,summary,description,customfield_10064,timetracking`
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': this.getAuthHeader(),
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        console.error('JIRA API Error:', response.status, response.statusText)
        return []
      }

      const data: JiraSearchResponse = await response.json()
      return data.issues.map(this.convertJiraIssueToTask)
    } catch (error) {
      console.error('Error searching JIRA tasks:', error)
      return []
    }
  }

  /**
   * Get a specific JIRA task by key
   * @param key - JIRA issue key (e.g., "PROJ-123")
   * @returns Promise<JiraTask | null>
   */
  async getTaskByKey(key: string): Promise<JiraTask | null> {
    try {
      const url = `${this.baseUrl}/rest/api/3/issue/${key}?fields=id,key,summary,description,customfield_10064,timetracking`
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': this.getAuthHeader(),
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        if (response.status === 404) {
          return null
        }
        console.error('JIRA API Error:', response.status, response.statusText)
        return null
      }

      const issue: JiraIssue = await response.json()
      return this.convertJiraIssueToTask(issue)
    } catch (error) {
      console.error('Error fetching JIRA task:', error)
      return null
    }
  }

  /**
   * Convert JIRA API response format to our internal task format
   * @param issue - JIRA issue from API
   * @returns JiraTask
   */
  private convertJiraIssueToTask(issue: JiraIssue): JiraTask {
    // Handle different description formats (API v2 vs v3)
    let description = issue.fields.description
    if (description && typeof description === 'object' && description.content) {
      // API v3 format - extract text from rich content
      description = JiraService.extractTextFromRichContent(description)
    }

    // Handle billing package - it might be a string or an object with a value property
    let billingPackage = null
    if (issue.fields.customfield_10064) {
      if (typeof issue.fields.customfield_10064 === 'string') {
        billingPackage = issue.fields.customfield_10064
      } else if (issue.fields.customfield_10064.value) {
        billingPackage = issue.fields.customfield_10064.value
      }
    }

    return {
      id: issue.id,
      key: issue.key,
      summary: issue.fields.summary,
      description: description,
      status: issue.fields.status?.name,
      assignee: issue.fields.assignee?.displayName,
      billingPackage: billingPackage,
      timeTracking: issue.fields.timetracking
    }
  }

  /**
   * Extract plain text from JIRA's rich content format (API v3)
   */
  private static extractTextFromRichContent(content: any): string {
    if (!content || !content.content) return ''

    let text = ''
    content.content.forEach((block: any) => {
      if (block.content) {
        block.content.forEach((inline: any) => {
          if (inline.type === 'text' && inline.text) {
            text += inline.text
          }
        })
      }
    })
    return text
  }

  /**
   * Get worklogs for a specific JIRA issue
   * @param issueKey - JIRA issue key (e.g., "PROJ-123")
   * @returns Promise<JiraWorklog[]>
   */
  async getWorklogsForIssue(issueKey: string): Promise<JiraWorklog[]> {
    try {
      const url = `${this.baseUrl}/rest/api/3/issue/${issueKey}/worklog`
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': this.getAuthHeader(),
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        console.error('JIRA API Error fetching worklogs:', response.status, response.statusText)
        return []
      }

      const data = await response.json()
      const worklogs = data.worklogs || []
      
      // Process worklogs to extract comment text from rich content
      return worklogs.map((worklog: any) => ({
        ...worklog,
        comment: worklog.comment ? JiraService.extractTextFromRichContent(worklog.comment) : undefined
      }))
    } catch (error) {
      console.error('Error fetching JIRA worklogs:', error)
      return []
    }
  }

  /**
   * Get all worklogs for a specific date across all issues
   * This searches for issues with worklogs and then fetches worklogs for each
   * @param date - Date string in YYYY-MM-DD format
   * @returns Promise<{issueKey: string, worklog: JiraWorklog}[]>
   */
  async getWorklogsForDate(date: string): Promise<{issueKey: string, summary: string, worklog: JiraWorklog}[]> {
    try {
      // JQL to find issues with work logged on the specific date
      const jql = encodeURIComponent(`worklogDate = ${date} AND worklogAuthor = currentUser()`)
      const searchUrl = `${this.baseUrl}/rest/api/3/search?jql=${jql}&fields=key,summary`
      
      const searchResponse = await fetch(searchUrl, {
        method: 'GET',
        headers: {
          'Authorization': this.getAuthHeader(),
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      })

      if (!searchResponse.ok) {
        console.error('JIRA API Error searching for issues with worklogs:', searchResponse.status)
        return []
      }

      const searchData = await searchResponse.json()
      const results: {issueKey: string, summary: string, worklog: JiraWorklog}[] = []

      // For each issue, fetch its worklogs and filter for the specific date
      for (const issue of searchData.issues) {
        const worklogs = await this.getWorklogsForIssue(issue.key)
        const dateWorklogs = worklogs.filter((worklog: any) => {
          const worklogDate = new Date(worklog.started).toISOString().split('T')[0]
          return worklogDate === date
        })
        
        for (const worklog of dateWorklogs) {
          // Ensure comment is a string, not an object
          const processedWorklog = {
            ...worklog,
            comment: typeof worklog.comment === 'string' ? worklog.comment : undefined
          }
          results.push({
            issueKey: issue.key,
            summary: issue.fields.summary,
            worklog: processedWorklog
          })
        }
      }

      return results
    } catch (error) {
      console.error('Error fetching worklogs for date:', error)
      return []
    }
  }

  /**
   * Validate JIRA task key format
   * @param key - Task key to validate
   * @returns boolean
   */
  isValidTaskKey(key: string): boolean {
    // Basic JIRA key format: PROJECT-123
    const jiraKeyPattern = /^[A-Z]+[A-Z0-9]*-\d+$/
    return jiraKeyPattern.test(key.toUpperCase())
  }
}

// Export singleton instance
export const jiraService = new JiraService()