import { JiraTask } from '@/types/jira'

export class JiraClientService {
  /**
   * Search for JIRA tasks by key or text via API route
   * @param query - Search term (task key or text)
   * @returns Promise<JiraTask[]>
   */
  async searchTasks(query: string): Promise<JiraTask[]> {
    if (!query.trim()) {
      return []
    }

    try {
      const response = await fetch(`/api/jira/search?q=${encodeURIComponent(query)}`)
      
      if (!response.ok) {
        console.error('JIRA search API error:', response.status, response.statusText)
        return []
      }

      return await response.json()
    } catch (error) {
      console.error('Error searching JIRA tasks:', error)
      return []
    }
  }

  /**
   * Get a specific JIRA task by key via API route
   * @param key - JIRA issue key (e.g., "PROJ-123")
   * @returns Promise<JiraTask | null>
   */
  async getTaskByKey(key: string): Promise<JiraTask | null> {
    try {
      const response = await fetch(`/api/jira/task/${encodeURIComponent(key)}`)

      if (!response.ok) {
        if (response.status === 404) {
          return null
        }
        console.error('JIRA task API error:', response.status, response.statusText)
        return null
      }

      return await response.json()
    } catch (error) {
      console.error('Error fetching JIRA task:', error)
      return null
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
export const jiraClientService = new JiraClientService()