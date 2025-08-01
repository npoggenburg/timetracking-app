import { NextRequest, NextResponse } from 'next/server'
import { jiraService } from '@/services/jira.service'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')

    if (!query || query.trim().length < 2) {
      return NextResponse.json([])
    }

    const tasks = await jiraService.searchTasks(query)
    return NextResponse.json(tasks)
  } catch (error) {
    console.error('JIRA search API error:', error)
    return NextResponse.json(
      { error: 'Failed to search JIRA tasks' }, 
      { status: 500 }
    )
  }
}