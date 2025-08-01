import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const dateParam = searchParams.get('date');
    
    if (!dateParam) {
      return NextResponse.json({ error: 'Date parameter is required' }, { status: 400 });
    }

    const date = new Date(dateParam);
    date.setHours(0, 0, 0, 0);
    
    const dailyWorkTime = await prisma.dailyWorkTime.findUnique({
      where: { date }
    });

    return NextResponse.json(dailyWorkTime || null);
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

    const parsedDate = new Date(date);
    parsedDate.setHours(0, 0, 0, 0);

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