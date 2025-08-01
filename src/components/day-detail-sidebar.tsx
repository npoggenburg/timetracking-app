'use client';

import { X, Clock, Tag, Briefcase, Calendar, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

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

interface DayDetailSidebarProps {
    isOpen: boolean;
    onClose: () => void;
    date: Date;
    timeEntries: TimeEntry[];
    officeTime?: number;
    totalTaskHours: number;
}

export function DayDetailSidebar({
    isOpen,
    onClose,
    date,
    timeEntries,
    officeTime,
    totalTaskHours
}: DayDetailSidebarProps) {
    if (!isOpen) return null;

    const formatDate = (date: Date) => {
        return date.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const formatTime = (hours?: number) => {
        if (!hours) return '0h';
        const h = Math.floor(hours);
        const m = Math.round((hours - h) * 60);
        return m > 0 ? `${h}h ${m}m` : `${h}h`;
    };

    const isWeekend = (date: Date) => {
        const day = date.getDay();
        return day === 0 || day === 6;
    };

    const getTimeDifference = () => {
        if (!officeTime || totalTaskHours === 0) return null;
        const difference = totalTaskHours - officeTime;
        return {
            amount: Math.abs(difference),
            type: difference > 0 ? 'over' : 'under'
        };
    };

    const timeDiff = getTimeDifference();

    const getStatusMessage = () => {
        if (isWeekend(date)) return { type: 'info', message: 'Weekend' };
        if (date > new Date()) return { type: 'info', message: 'Future date' };
        
        const hasTimeEntries = timeEntries.length > 0;
        const hasOfficeTime = officeTime !== undefined && officeTime > 0;
        
        if (!hasTimeEntries && !hasOfficeTime) {
            return { type: 'error', message: 'No time tracking data for this day' };
        }
        if (!hasOfficeTime) {
            return { type: 'warning', message: 'Missing office time entry' };
        }
        if (!hasTimeEntries) {
            return { type: 'warning', message: 'Missing task entries' };
        }
        
        if (timeDiff && timeDiff.amount > 0.5) {
            return {
                type: 'warning',
                message: `Task time is ${formatTime(timeDiff.amount)} ${timeDiff.type} office time`
            };
        }
        
        return { type: 'success', message: 'Complete tracking for this day' };
    };

    const status = getStatusMessage();

    return (
        <>
            {/* Backdrop */}
            <div className='fixed inset-0 bg-black/20 z-40' onClick={onClose} />
            
            {/* Sidebar */}
            <div className='fixed right-0 top-0 h-full w-96 bg-white shadow-xl border-l border-gray-200 z-50 overflow-y-auto'>
                <div className='p-6'>
                    {/* Header */}
                    <div className='flex items-start justify-between mb-6'>
                        <div>
                            <h2 className='text-xl font-semibold text-gray-900'>
                                {formatDate(date)}
                            </h2>
                            <div className={`mt-2 px-3 py-1 rounded-full text-sm font-medium inline-flex items-center gap-1 ${
                                status.type === 'success' ? 'bg-green-100 text-green-800' :
                                status.type === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                                status.type === 'error' ? 'bg-red-100 text-red-800' :
                                'bg-gray-100 text-gray-800'
                            }`}>
                                {status.type === 'error' && <AlertCircle className='h-3 w-3' />}
                                {status.message}
                            </div>
                        </div>
                        <Button
                            variant='ghost'
                            size='sm'
                            onClick={onClose}
                            className='text-gray-400 hover:text-gray-600'
                        >
                            <X className='h-5 w-5' />
                        </Button>
                    </div>

                    {/* Time Summary */}
                    <div className='grid grid-cols-2 gap-4 mb-6'>
                        <div className='bg-blue-50 border border-blue-100 rounded-lg p-4'>
                            <div className='flex items-center gap-2 mb-1'>
                                <Clock className='h-4 w-4 text-blue-600' />
                                <span className='text-sm font-medium text-blue-900'>Office Time</span>
                            </div>
                            <div className='text-xl font-bold text-blue-900'>
                                {officeTime ? formatTime(officeTime) : 'Not set'}
                            </div>
                        </div>
                        
                        <div className='bg-green-50 border border-green-100 rounded-lg p-4'>
                            <div className='flex items-center gap-2 mb-1'>
                                <Tag className='h-4 w-4 text-green-600' />
                                <span className='text-sm font-medium text-green-900'>Task Time</span>
                            </div>
                            <div className='text-xl font-bold text-green-900'>
                                {formatTime(totalTaskHours)}
                            </div>
                        </div>
                    </div>

                    {/* Time Difference Alert */}
                    {timeDiff && timeDiff.amount > 0.5 && (
                        <div className={`mb-6 p-3 rounded-lg border ${
                            timeDiff.type === 'over' 
                                ? 'bg-orange-50 border-orange-200 text-orange-800'
                                : 'bg-yellow-50 border-yellow-200 text-yellow-800'
                        }`}>
                            <div className='flex items-center gap-2'>
                                <AlertCircle className='h-4 w-4' />
                                <span className='text-sm font-medium'>
                                    You logged {formatTime(timeDiff.amount)} {timeDiff.type === 'over' ? 'more' : 'less'} 
                                    {' '}task time than office time
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Time Entries */}
                    <div>
                        <h3 className='text-lg font-semibold mb-4'>
                            Time Entries ({timeEntries.length})
                        </h3>
                        
                        {timeEntries.length === 0 ? (
                            <div className='text-center py-8 text-gray-500'>
                                <Tag className='h-8 w-8 mx-auto mb-2 opacity-50' />
                                <p>No time entries recorded for this day</p>
                            </div>
                        ) : (
                            <div className='space-y-3'>
                                {timeEntries.map((entry) => (
                                    <div
                                        key={entry.id}
                                        className='bg-white border border-gray-200 rounded-lg p-4 shadow-sm'
                                    >
                                        {/* Entry Header */}
                                        <div className='flex items-start justify-between mb-2'>
                                            <div className='flex items-center gap-2 flex-1 min-w-0'>
                                                {entry.jiraKey ? (
                                                    <Briefcase className='h-4 w-4 text-blue-600 flex-shrink-0' />
                                                ) : (
                                                    <Tag 
                                                        className='h-4 w-4 flex-shrink-0'
                                                        style={{ color: entry.category?.color || '#10b981' }}
                                                    />
                                                )}
                                                <span className='font-medium text-sm truncate'>
                                                    {entry.jiraKey || entry.category?.name}
                                                </span>
                                            </div>
                                            {entry.hours && (
                                                <span className='text-xs font-mono bg-gray-100 text-gray-700 px-2 py-1 rounded flex-shrink-0'>
                                                    {formatTime(entry.hours)}
                                                </span>
                                            )}
                                        </div>

                                        {/* Entry Details */}
                                        <div className='space-y-1'>
                                            {entry.jiraBillingPackage && (
                                                <div className='text-xs text-blue-600'>
                                                    {entry.jiraBillingPackage}
                                                </div>
                                            )}
                                            
                                            {entry.category?.type === 'day' && (
                                                <div className='text-xs text-purple-600 flex items-center gap-1'>
                                                    <Calendar className='h-3 w-3' />
                                                    Full day entry
                                                </div>
                                            )}

                                            {entry.description && (
                                                <div className='text-xs text-gray-600 mt-2 leading-relaxed'>
                                                    {entry.description}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Actions */}
                    {!isWeekend(date) && date <= new Date() && (
                        <div className='mt-6 pt-6 border-t border-gray-200'>
                            <div className='flex gap-2'>
                                <Button 
                                    variant='outline' 
                                    size='sm'
                                    onClick={() => {
                                        // Navigate to time tracking page with this date pre-selected
                                        window.location.href = `/?date=${date.toISOString().split('T')[0]}`;
                                    }}
                                    className='flex-1'
                                >
                                    Add Time Entry
                                </Button>
                                {!officeTime && (
                                    <Button 
                                        variant='outline' 
                                        size='sm'
                                        onClick={() => {
                                            onClose();
                                            // Could trigger office time popover here
                                        }}
                                        className='flex-1'
                                    >
                                        Set Office Time
                                    </Button>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}