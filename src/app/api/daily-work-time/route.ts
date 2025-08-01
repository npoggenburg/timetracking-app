import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const dateParam = searchParams.get('date');
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');
    
    if (dateParam) {
      // Single date query - parse as UTC to match storage format
      const date = new Date(dateParam + 'T00:00:00.000Z');
      
      const dailyWorkTime = await prisma.dailyWorkTime.findUnique({
        where: { date }
      });

      return NextResponse.json(dailyWorkTime || null);
    } else if (startDateParam && endDateParam) {
      // Date range query - parse as UTC to match storage format
      const startDate = new Date(startDateParam + 'T00:00:00.000Z');
      const endDate = new Date(endDateParam + 'T23:59:59.999Z');
      
      const dailyWorkTimes = await prisma.dailyWorkTime.findMany({
        where: {
          date: {
            gte: startDate,
            lte: endDate
          }
        },
        orderBy: {
          date: 'asc'
        }
      });

      return NextResponse.json(dailyWorkTimes);
    } else {
      return NextResponse.json({ error: 'Date parameter or date range (startDate and endDate) is required' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error fetching daily work time:', error);
    return NextResponse.json(
      { error: 'Failed to fetch daily work time' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { date, totalHours } = body;

    if (!date || totalHours === undefined) {
      return NextResponse.json(
        { error: 'Date and totalHours are required' },
        { status: 400 }
      );
    }

    // Parse date ensuring consistent format
    const parsedDate = new Date(date + 'T00:00:00.000Z');

    const dailyWorkTime = await prisma.dailyWorkTime.upsert({
      where: { date: parsedDate },
      update: { totalHours },
      create: { date: parsedDate, totalHours }
    });

    return NextResponse.json(dailyWorkTime);
  } catch (error) {
    console.error('Error saving daily work time:', error);
    return NextResponse.json(
      { error: 'Failed to save daily work time' },
      { status: 500 }
    );
  }
}