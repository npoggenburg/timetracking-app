import { NextRequest, NextResponse } from 'next/server'
import { jiraService } from '@/services/jira.service'

export async function GET(
  request: NextRequest,
  { params }: { params: { key: string } }
) {
  try {
    const { key } = params

    if (!key) {
      return NextResponse.json(
        { error: 'Task key is required' }, 
        { status: 400 }
      )
    }

    const task = await jiraService.getTaskByKey(key)
    
    if (!task) {
      return NextResponse.json(
        { error: 'Task not found' }, 
        { status: 404 }
      )
    }

    return NextResponse.json(task)
  } catch (error) {
    console.error('JIRA task API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch JIRA task' }, 
      { status: 500 }
    )
  }
}