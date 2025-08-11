import { NextRequest, NextResponse } from 'next/server'
import { jiraService } from '@/services/jira.service'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date')
    
    if (!date) {
      return NextResponse.json(
        { error: 'Date parameter is required' },
        { status: 400 }
      )
    }

    // Fetch worklogs from JIRA for the specified date
    const worklogs = await jiraService.getWorklogsForDate(date)
    
    return NextResponse.json(worklogs)
  } catch (error) {
    console.error('Error fetching JIRA worklogs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch JIRA worklogs' },
      { status: 500 }
    )
  }
}