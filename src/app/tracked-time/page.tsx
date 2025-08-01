'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Clock, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DayDetailSidebar } from '@/components/day-detail-sidebar';

interface TimeEntry {
    id: string;
    date: string;
    hours?: number;
    jiraKey?: string;
    jiraBillingPackage?: string;
    description?: string;
    category?: {
        name: string;
        type: string;
        color?: string;
    };
}

interface DailyWorkTime {
    date: string;
    totalHours: number;
}

interface DayData {
    date: Date;
    timeEntries: TimeEntry[];
    officeTime?: number;
    totalTaskHours: number;
}

export default function TrackedTimePage() {
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [monthData, setMonthData] = useState<DayData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedDay, setSelectedDay] = useState<DayData | null>(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    useEffect(() => {
        fetchMonthData();
    }, [currentMonth]);

    const fetchMonthData = async () => {
        setIsLoading(true);
        try {
            const year = currentMonth.getFullYear();
            const month = currentMonth.getMonth();
            const startDate = new Date(year, month, 1);
            const endDate = new Date(year, month + 1, 0);

            // Fetch time entries for the month
            const entriesResponse = await fetch(
                `/api/time-entries?startDate=${startDate.toISOString().split('T')[0]}&endDate=${
                    endDate.toISOString().split('T')[0]
                }`
            );
            const entries: TimeEntry[] = await entriesResponse.json();

            // Fetch office times for the month
            const officeTimesResponse = await fetch(
                `/api/daily-work-time?startDate=${startDate.toISOString().split('T')[0]}&endDate=${
                    endDate.toISOString().split('T')[0]
                }`
            );
            const officeTimes: DailyWorkTime[] = await officeTimesResponse.json();

            // Create a map of office times by date
            const officeTimeMap = new Map(officeTimes.map((ot) => [ot.date.split('T')[0], ot.totalHours]));

            // Group entries by date
            const entriesByDate = new Map<string, TimeEntry[]>();
            entries.forEach((entry) => {
                const dateKey = entry.date.split('T')[0];
                if (!entriesByDate.has(dateKey)) {
                    entriesByDate.set(dateKey, []);
                }
                entriesByDate.get(dateKey)!.push(entry);
            });

            // Build calendar data
            const daysInMonth = endDate.getDate();
            const monthDays: DayData[] = [];

            for (let day = 1; day <= daysInMonth; day++) {
                const date = new Date(year, month, day);
                // Use local date string to match what we get from the API
                const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const dayEntries = entriesByDate.get(dateKey) || [];
                const totalTaskHours = dayEntries.reduce((sum, entry) => sum + (entry.hours || 0), 0);

                monthDays.push({
                    date,
                    timeEntries: dayEntries,
                    officeTime: officeTimeMap.get(dateKey),
                    totalTaskHours,
                });
            }

            setMonthData(monthDays);
        } catch (error) {
            console.error('Error fetching month data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const navigateMonth = (direction: 'prev' | 'next') => {
        setCurrentMonth((prev) => {
            const newMonth = new Date(prev);
            if (direction === 'prev') {
                newMonth.setMonth(prev.getMonth() - 1);
            } else {
                newMonth.setMonth(prev.getMonth() + 1);
            }
            return newMonth;
        });
    };

    const handleDayClick = (day: DayData) => {
        setSelectedDay(day);
        setIsSidebarOpen(true);
    };

    const handleCloseSidebar = () => {
        setIsSidebarOpen(false);
        setSelectedDay(null);
    };

    const formatMonthYear = (date: Date) => {
        return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    };

    const getDayOfWeek = (date: Date) => {
        return date.toLocaleDateString('en-US', { weekday: 'short' });
    };

    const getFirstDayOffset = () => {
        const firstDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
        return firstDay.getDay();
    };

    const isWeekend = (date: Date) => {
        const day = date.getDay();
        return day === 0 || day === 6;
    };

    const isToday = (date: Date) => {
        const today = new Date();
        return (
            date.getDate() === today.getDate() &&
            date.getMonth() === today.getMonth() &&
            date.getFullYear() === today.getFullYear()
        );
    };

    const formatHours = (hours: number) => {
        const h = Math.floor(hours);
        const m = Math.round((hours - h) * 60);
        return m > 0 ? `${h}h ${m}m` : `${h}h`;
    };

    const getDayStatus = (day: DayData) => {
        if (isWeekend(day.date)) return 'weekend';
        if (day.date > new Date()) return 'future';

        const hasTimeEntries = day.timeEntries.length > 0;
        const hasOfficeTime = day.officeTime !== undefined && day.officeTime > 0;

        if (!hasTimeEntries && !hasOfficeTime) return 'missing';
        if (!hasOfficeTime) return 'no-office-time';
        if (!hasTimeEntries) return 'no-entries';

        // Check if task hours match office hours (within 30 minutes tolerance)
        const difference = Math.abs(day.totalTaskHours - day.officeTime);
        if (difference > 0.5) return 'mismatch';

        return 'complete';
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'complete':
                return 'bg-green-50 border-green-200';
            case 'mismatch':
                return 'bg-yellow-50 border-yellow-200';
            case 'missing':
                return 'bg-red-50 border-red-200';
            case 'no-office-time':
                return 'bg-orange-50 border-orange-200';
            case 'no-entries':
                return 'bg-blue-50 border-blue-200';
            case 'weekend':
                return 'bg-gray-50 border-gray-200';
            case 'future':
                return 'bg-white border-gray-100';
            default:
                return 'bg-white border-gray-200';
        }
    };

    if (isLoading) {
        return (
            <div className='container mx-auto px-4 py-8'>
                <div className='flex items-center justify-center h-64'>
                    <div className='text-center'>
                        <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto'></div>
                        <p className='mt-4 text-gray-600'>Loading tracked time...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className='container mx-auto px-4 py-8'>
            <div className='max-w-7xl mx-auto'>
                {/* Header */}
                <div className='mb-8'>
                    <h1 className='text-3xl font-bold mb-4'>Tracked Time Overview</h1>

                    {/* Month Navigation */}
                    <div className='flex items-center justify-between mb-6'>
                        <Button
                            variant='outline'
                            onClick={() => navigateMonth('prev')}
                            className='flex items-center gap-2'
                        >
                            <ChevronLeft className='h-4 w-4' />
                            Previous
                        </Button>
                        <h2 className='text-xl font-semibold'>{formatMonthYear(currentMonth)}</h2>
                        <Button
                            variant='outline'
                            onClick={() => navigateMonth('next')}
                            className='flex items-center gap-2'
                        >
                            Next
                            <ChevronRight className='h-4 w-4' />
                        </Button>
                    </div>

                    {/* Legend */}
                    <div className='flex flex-wrap gap-4 text-sm'>
                        <div className='flex items-center gap-2'>
                            <div className='w-4 h-4 bg-green-50 border border-green-200 rounded'></div>
                            <span>Complete</span>
                        </div>
                        <div className='flex items-center gap-2'>
                            <div className='w-4 h-4 bg-yellow-50 border border-yellow-200 rounded'></div>
                            <span>Time Mismatch</span>
                        </div>
                        <div className='flex items-center gap-2'>
                            <div className='w-4 h-4 bg-orange-50 border border-orange-200 rounded'></div>
                            <span>Missing Office Time</span>
                        </div>
                        <div className='flex items-center gap-2'>
                            <div className='w-4 h-4 bg-blue-50 border border-blue-200 rounded'></div>
                            <span>Missing Task Entries</span>
                        </div>
                        <div className='flex items-center gap-2'>
                            <div className='w-4 h-4 bg-red-50 border border-red-200 rounded'></div>
                            <span>No Data</span>
                        </div>
                    </div>
                </div>

                {/* Calendar Grid */}
                <div className='bg-white rounded-lg shadow border border-gray-200'>
                    {/* Day Headers */}
                    <div className='grid grid-cols-7 border-b border-gray-200'>
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                            <div key={day} className='p-3 text-center text-sm font-medium text-gray-700'>
                                {day}
                            </div>
                        ))}
                    </div>

                    {/* Calendar Days */}
                    <div className='grid grid-cols-7'>
                        {/* Empty cells for first week */}
                        {Array.from({ length: getFirstDayOffset() }).map((_, index) => (
                            <div key={`empty-${index}`} className='p-2 border-r border-b border-gray-100'></div>
                        ))}

                        {/* Actual days */}
                        {monthData.map((day, index) => {
                            const status = getDayStatus(day);
                            const statusColor = getStatusColor(status);

                            return (
                                <button
                                    key={index}
                                    onClick={() => handleDayClick(day)}
                                    className={`p-2 border-r border-b border-gray-100 min-h-[100px] w-full text-left hover:bg-opacity-80 transition-colors ${statusColor} ${
                                        isToday(day.date) ? 'ring-2 ring-blue-500' : ''
                                    }`}
                                >
                                    <div className='flex justify-between items-start mb-1'>
                                        <span
                                            className={`text-sm font-medium ${
                                                isWeekend(day.date) ? 'text-gray-500' : ''
                                            }`}
                                        >
                                            {day.date.getDate()}
                                        </span>
                                        {status === 'mismatch' && <AlertCircle className='h-4 w-4 text-yellow-600' />}
                                    </div>

                                    {!isWeekend(day.date) && day.date <= new Date() && (
                                        <div className='space-y-1 text-xs'>
                                            {day.officeTime !== undefined && (
                                                <div className='flex items-center gap-1 text-gray-600'>
                                                    <Clock className='h-3 w-3' />
                                                    <span>Office: {formatHours(day.officeTime)}</span>
                                                </div>
                                            )}
                                            {day.totalTaskHours > 0 && (
                                                <div className='text-gray-600'>
                                                    Tasks: {formatHours(day.totalTaskHours)}
                                                </div>
                                            )}
                                            {day.timeEntries.length > 0 && (
                                                <div className='text-gray-500'>
                                                    {day.timeEntries.length}{' '}
                                                    {day.timeEntries.length === 1 ? 'entry' : 'entries'}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Summary Stats */}
                <div className='mt-8 grid grid-cols-1 md:grid-cols-4 gap-4'>
                    <div className='bg-white p-4 rounded-lg border border-gray-200'>
                        <h3 className='text-sm font-medium text-gray-600 mb-2'>Total Days Tracked</h3>
                        <p className='text-2xl font-bold'>
                            {monthData.filter((d) => d.timeEntries.length > 0 && !isWeekend(d.date)).length}
                        </p>
                    </div>
                    <div className='bg-white p-4 rounded-lg border border-gray-200'>
                        <h3 className='text-sm font-medium text-gray-600 mb-2'>Total Office Hours</h3>
                        <p className='text-2xl font-bold'>
                            {formatHours(monthData.reduce((sum, d) => sum + (d.officeTime || 0), 0))}
                        </p>
                    </div>
                    <div className='bg-white p-4 rounded-lg border border-gray-200'>
                        <h3 className='text-sm font-medium text-gray-600 mb-2'>Total Task Hours</h3>
                        <p className='text-2xl font-bold'>
                            {formatHours(monthData.reduce((sum, d) => sum + d.totalTaskHours, 0))}
                        </p>
                    </div>
                    <div className='bg-white p-4 rounded-lg border border-gray-200'>
                        <h3 className='text-sm font-medium text-gray-600 mb-2'>Missing Days</h3>
                        <p className='text-2xl font-bold text-red-600'>
                            {
                                monthData.filter(
                                    (d) =>
                                        !isWeekend(d.date) &&
                                        d.date <= new Date() &&
                                        d.timeEntries.length === 0 &&
                                        !d.officeTime
                                ).length
                            }
                        </p>
                    </div>
                </div>
            </div>

            {/* Day Detail Sidebar */}
            {selectedDay && (
                <DayDetailSidebar
                    isOpen={isSidebarOpen}
                    onClose={handleCloseSidebar}
                    date={selectedDay.date}
                    timeEntries={selectedDay.timeEntries}
                    officeTime={selectedDay.officeTime}
                    totalTaskHours={selectedDay.totalTaskHours}
                />
            )}
        </div>
    );
}
