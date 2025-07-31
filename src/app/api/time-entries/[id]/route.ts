import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const body = await request.json()
    const { hours, date, endDate, description } = body

    // Validate entry exists
    const existingEntry = await prisma.timeEntry.findUnique({
      where: { id },
      include: { category: true }
    })

    if (!existingEntry) {
      return NextResponse.json(
        { error: 'Time entry not found' },
        { status: 404 }
      )
    }

    // Prepare update data
    const updateData: any = {}

    if (date !== undefined) {
      updateData.date = new Date(date)
    }

    if (endDate !== undefined) {
      updateData.endDate = endDate ? new Date(endDate) : null
    }

    if (description !== undefined) {
      updateData.description = description.trim() || null
    }

    // Validate and update hours for time-based entries
    if (hours !== undefined) {
      const hoursNum = parseFloat(hours)
      if (isNaN(hoursNum) || hoursNum < 0) {
        return NextResponse.json(
          { error: 'Hours must be a valid positive number' },
          { status: 400 }
        )
      }

      // Only allow hours update for time-based entries (JIRA or time-based categories)
      if (existingEntry.jiraKey || existingEntry.category?.type !== 'day') {
        updateData.hours = hoursNum
      }
    }

    // Update the entry
    const updatedEntry = await prisma.timeEntry.update({
      where: { id },
      data: updateData,
      include: { category: true }
    })

    return NextResponse.json(updatedEntry)
  } catch (error) {
    console.error('Error updating time entry:', error)
    return NextResponse.json(
      { error: 'Failed to update time entry' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    // Check if entry exists
    const existingEntry = await prisma.timeEntry.findUnique({
      where: { id }
    })

    if (!existingEntry) {
      return NextResponse.json(
        { error: 'Time entry not found' },
        { status: 404 }
      )
    }

    // Delete the entry
    await prisma.timeEntry.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting time entry:', error)
    return NextResponse.json(
      { error: 'Failed to delete time entry' },
      { status: 500 }
    )
  }
}