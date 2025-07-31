import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const dateFilter = searchParams.get('date')
    
    let whereClause = {}
    
    if (dateFilter) {
      // Filter entries for a specific date
      const startDate = new Date(dateFilter)
      const endDate = new Date(startDate)
      endDate.setDate(endDate.getDate() + 1)
      
      whereClause = {
        date: {
          gte: startDate,
          lt: endDate,
        },
      }
    }

    const timeEntries = await prisma.timeEntry.findMany({
      where: whereClause,
      include: {
        category: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json(timeEntries)
  } catch (error) {
    console.error('Error fetching time entries:', error)
    return NextResponse.json(
      { error: 'Failed to fetch time entries' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, jiraTask, category, hours, date, endDate, description } = body

    // Validate required fields
    if (!type || !date) {
      return NextResponse.json(
        { error: 'Missing required fields: type, date' },
        { status: 400 }
      )
    }

    // Validate entry type
    if (type !== 'jira' && type !== 'category') {
      return NextResponse.json(
        { error: 'Invalid entry type. Must be "jira" or "category"' },
        { status: 400 }
      )
    }

    // Validate hours for time-based entries
    let hoursNum: number | undefined
    if (hours !== undefined) {
      hoursNum = parseFloat(hours)
      if (isNaN(hoursNum) || hoursNum <= 0) {
        return NextResponse.json(
          { error: 'Hours must be a positive number' },
          { status: 400 }
        )
      }
    }

    let timeEntry

    if (type === 'jira') {
      if (!jiraTask || !jiraTask.key) {
        return NextResponse.json(
          { error: 'JIRA task is required for JIRA entries' },
          { status: 400 }
        )
      }

      if (hoursNum === undefined) {
        return NextResponse.json(
          { error: 'Hours are required for JIRA entries' },
          { status: 400 }
        )
      }

      // Create time entry with JIRA key and billing package only
      timeEntry = await prisma.timeEntry.create({
        data: {
          hours: hoursNum,
          date: new Date(date),
          endDate: endDate ? new Date(endDate) : null,
          description,
          jiraKey: jiraTask.key,
          jiraBillingPackage: jiraTask.billingPackage,
        },
      })
    } else {
      // Category entry
      if (!category || !category.id) {
        return NextResponse.json(
          { error: 'Category is required for category entries' },
          { status: 400 }
        )
      }

      // Verify category exists in database
      const existingCategory = await prisma.category.findUnique({
        where: { id: category.id },
      })

      if (!existingCategory) {
        return NextResponse.json(
          { error: 'Selected category does not exist' },
          { status: 400 }
        )
      }

      // Validate based on category type
      if (existingCategory.type === 'day') {
        // Day-based category - hours are optional, date is required
        if (!date) {
          return NextResponse.json(
            { error: 'Date is required for day-based entries' },
            { status: 400 }
          )
        }
      } else {
        // Time-based category - hours are required
        if (hoursNum === undefined) {
          return NextResponse.json(
            { error: 'Hours are required for time-based entries' },
            { status: 400 }
          )
        }
      }

      // Create time entry linked to existing category
      timeEntry = await prisma.timeEntry.create({
        data: {
          hours: hoursNum || null,
          date: new Date(date),
          endDate: endDate ? new Date(endDate) : null,
          description,
          categoryId: category.id,
        },
        include: {
          category: true,
        },
      })
    }

    return NextResponse.json(timeEntry, { status: 201 })
  } catch (error) {
    console.error('Error creating time entry:', error)
    return NextResponse.json(
      { error: 'Failed to create time entry' },
      { status: 500 }
    )
  }
}