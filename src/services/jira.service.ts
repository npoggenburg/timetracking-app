import { JiraTask, JiraSearchResponse, JiraIssue } from '@/types/jira'

export class JiraService {
  // Mock data for development
  private mockTasks: JiraIssue[] = [
    {
      id: '10001',
      key: 'PROJ-123',
      fields: {
        summary: 'Implement user authentication system',
        description: 'Create login/logout functionality with JWT tokens',
        status: { name: 'In Progress' },
        assignee: { displayName: 'John Doe', emailAddress: 'john@company.com' },
        customfield_10040: 'Enterprise Package'
      }
    },
    {
      id: '10002',
      key: 'PROJ-124',
      fields: {
        summary: 'Fix database connection issues',
        description: 'Resolve timeout errors in production database',
        status: { name: 'Open' },
        assignee: { displayName: 'Jane Smith', emailAddress: 'jane@company.com' },
        customfield_10040: 'Basic Package'
      }
    },
    {
      id: '10003',
      key: 'PROJ-125',
      fields: {
        summary: 'Update API documentation',
        description: 'Add examples and improve clarity of endpoints',
        status: { name: 'Done' },
        assignee: { displayName: 'Bob Wilson', emailAddress: 'bob@company.com' },
        customfield_10040: 'Premium Package'
      }
    },
    {
      id: '10004',
      key: 'DEV-456',
      fields: {
        summary: 'Performance optimization for dashboard',
        description: 'Improve loading times by implementing caching',
        status: { name: 'Code Review' },
        assignee: { displayName: 'Alice Brown', emailAddress: 'alice@company.com' },
        customfield_10040: 'Enterprise Package'
      }
    },
    {
      id: '10005',
      key: 'BUG-789',
      fields: {
        summary: 'Memory leak in background service',
        description: 'Fix memory accumulation in long-running processes',
        status: { name: 'In Progress' },
        assignee: { displayName: 'Charlie Green', emailAddress: 'charlie@company.com' },
        customfield_10040: 'Basic Package'
      }
    }
  ]

  /**
   * Search for JIRA tasks by key or text
   * @param query - Search term (task key or text)
   * @returns Promise<JiraTask[]>
   */
  async searchTasks(query: string): Promise<JiraTask[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300))

    if (!query.trim()) {
      return []
    }

    // Filter mock tasks based on query
    const filteredTasks = this.mockTasks.filter(issue => 
      issue.key.toLowerCase().includes(query.toLowerCase()) ||
      issue.fields.summary.toLowerCase().includes(query.toLowerCase())
    )

    // Convert to our internal format
    return filteredTasks.map(this.convertJiraIssueToTask)
  }

  /**
   * Get a specific JIRA task by key
   * @param key - JIRA issue key (e.g., "PROJ-123")
   * @returns Promise<JiraTask | null>
   */
  async getTaskByKey(key: string): Promise<JiraTask | null> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 200))

    const issue = this.mockTasks.find(task => 
      task.key.toLowerCase() === key.toLowerCase()
    )

    if (!issue) {
      return null
    }

    return this.convertJiraIssueToTask(issue)
  }

  /**
   * Convert JIRA API response format to our internal task format
   * @param issue - JIRA issue from API
   * @returns JiraTask
   */
  private convertJiraIssueToTask(issue: JiraIssue): JiraTask {
    return {
      id: issue.id,
      key: issue.key,
      summary: issue.fields.summary,
      description: issue.fields.description,
      status: issue.fields.status?.name,
      assignee: issue.fields.assignee?.displayName,
      billingPackage: issue.fields.customfield_10040
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