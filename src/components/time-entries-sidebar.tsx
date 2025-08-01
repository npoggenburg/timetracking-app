'use client';

import { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { Clock, Calendar, Tag, Briefcase, Plus } from 'lucide-react';
import { TimeEntryEditPopover } from './time-entry-edit-popover';
import { OfficeTimePopover } from './office-time-popover';

interface TimeEntry {
    id: string;
    hours?: number;
    date: string;
    endDate?: string;
    jiraKey?: string;
    jiraBillingPackage?: string;
    description?: string;
    category?: {
        id: string;
        name: string;
        color?: string;
        type?: string;
    };
    createdAt: string;
}

interface TimeEntriesSidebarProps {
    refreshTrigger?: number; // Used to trigger refresh when new entries are added
}

export interface TimeEntriesSidebarRef {
    focus: () => void;
}

export const TimeEntriesSidebar = forwardRef<TimeEntriesSidebarRef, TimeEntriesSidebarProps>(
    ({ refreshTrigger }, ref) => {
        const [entries, setEntries] = useState<TimeEntry[]>([]);
        const [isLoading, setIsLoading] = useState(true);
        const [error, setError] = useState<string | null>(null);
        const [editingEntry, setEditingEntry] = useState<TimeEntry | null>(null);
        const [popoverPosition, setPopoverPosition] = useState({ x: 0, y: 0 });
        const [focusedIndex, setFocusedIndex] = useState(-1);
        const [isSidebarFocused, setIsSidebarFocused] = useState(false);
        const [showOfficeTimePopover, setShowOfficeTimePopover] = useState(false);
        const [officeTimePopoverPosition, setOfficeTimePopoverPosition] = useState({ x: 0, y: 0 });
        const [dailyWorkTime, setDailyWorkTime] = useState<number | null>(null);
        const sidebarRef = useRef<HTMLDivElement>(null);
        const officeTimeButtonRef = useRef<HTMLButtonElement>(null);

        useImperativeHandle(ref, () => ({
            focus: () => {
                setIsSidebarFocused(true);
                setFocusedIndex(entries.length > 0 ? 0 : -1);
                sidebarRef.current?.focus();
            },
        }));

        const fetchTodaysEntries = async () => {
            try {
                setIsLoading(true);
                const today = new Date().toISOString().split('T')[0];

                // Fetch both time entries and daily work time
                const [entriesResponse, workTimeResponse] = await Promise.all([
                    fetch(`/api/time-entries?date=${today}`),
                    fetch(`/api/daily-work-time?date=${today}`),
                ]);

                if (!entriesResponse.ok) {
                    throw new Error('Failed to fetch time entries');
                }

                const entriesData = await entriesResponse.json();
                setEntries(entriesData);

                if (workTimeResponse.ok) {
                    try {
                        const workTimeData = await workTimeResponse.json();
                        setDailyWorkTime(workTimeData?.totalHours || null);
                    } catch (err) {
                        // If JSON parsing fails or no data, just set to null
                        setDailyWorkTime(null);
                    }
                } else {
                    // If the endpoint returns error (like 404), just ignore it
                    setDailyWorkTime(null);
                }

                setError(null);
            } catch (error) {
                console.error('Error fetching time entries:', error);
                setError('Failed to load time entries');
            } finally {
                setIsLoading(false);
            }
        };

        useEffect(() => {
            fetchTodaysEntries();
        }, [refreshTrigger]);

        const formatTime = (hours?: number) => {
            if (!hours) return 'N/A';
            const h = Math.floor(hours);
            const m = Math.round((hours - h) * 60);
            return m > 0 ? `${h}h ${m}m` : `${h}h`;
        };

        const formatDate = (dateStr: string, endDateStr?: string) => {
            const date = new Date(dateStr);

            if (endDateStr) {
                const endDate = new Date(endDateStr);
                return `${date.toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                })} - ${endDate.toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                })}`;
            }

            return date.toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                year: 'numeric',
            });
        };

        const getTotalHours = () => {
            return entries.reduce((total, entry) => total + (entry.hours || 0), 0);
        };

        const handleEditEntry = (entry: TimeEntry, event: React.MouseEvent) => {
            const rect = event.currentTarget.getBoundingClientRect();
            const popoverHeight = 400; // Approximate height of the popover
            const viewportHeight = window.innerHeight;

            setPopoverPosition({
                x: rect.left - 320, // Position to the left of the sidebar
                y: (viewportHeight - popoverHeight) / 2, // Center vertically on screen
            });
            setEditingEntry(entry);
        };

        const handleSaveEntry = async (entryId: string, updates: any) => {
            try {
                const response = await fetch(`/api/time-entries/${entryId}`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(updates),
                });

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
                    console.error('API Error:', errorData);
                    throw new Error(errorData.error || 'Failed to update entry');
                }

                // Refresh the entries list
                await fetchTodaysEntries();
            } catch (error) {
                console.error('Error updating entry:', error);
                throw error;
            }
        };

        const handleClosePopover = () => {
            setEditingEntry(null);
        };

        const handleOfficeTimeClick = () => {
            if (officeTimeButtonRef.current) {
                const rect = officeTimeButtonRef.current.getBoundingClientRect();
                const popoverHeight = 200; // Approximate height of the popover
                const viewportHeight = window.innerHeight;

                setOfficeTimePopoverPosition({
                    x: rect.left - 320, // Position to the left of the sidebar
                    y: Math.min(rect.top, viewportHeight - popoverHeight - 20), // Ensure it fits in viewport
                });
            }
            setShowOfficeTimePopover(true);
        };

        const handleSaveOfficeTime = async (totalHours: number) => {
            try {
                const today = new Date().toISOString().split('T')[0];
                const response = await fetch('/api/daily-work-time', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        date: today,
                        totalHours,
                    }),
                });

                if (!response.ok) {
                    throw new Error('Failed to save office time');
                }

                setDailyWorkTime(totalHours);
                setShowOfficeTimePopover(false);
            } catch (error) {
                console.error('Error saving office time:', error);
                throw error;
            }
        };

        // Handle keyboard navigation
        const handleKeyDown = (e: React.KeyboardEvent) => {
            if (!isSidebarFocused || entries.length === 0) return;

            switch (e.key) {
                case 'ArrowDown':
                    e.preventDefault();
                    setFocusedIndex((prev) => (prev < entries.length - 1 ? prev + 1 : 0));
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    setFocusedIndex((prev) => (prev > 0 ? prev - 1 : entries.length - 1));
                    break;
                case 'Enter':
                    e.preventDefault();
                    if (focusedIndex >= 0 && focusedIndex < entries.length) {
                        const entry = entries[focusedIndex];
                        const rect = sidebarRef.current?.getBoundingClientRect();
                        if (rect) {
                            handleEditEntry(entry, {
                                currentTarget: { getBoundingClientRect: () => rect },
                            } as React.MouseEvent);
                        }
                    }
                    break;
                case 'Escape':
                    e.preventDefault();
                    setIsSidebarFocused(false);
                    setFocusedIndex(-1);
                    sidebarRef.current?.blur();
                    break;
            }
        };

        const handleSidebarBlur = () => {
            setIsSidebarFocused(false);
            setFocusedIndex(-1);
        };

        if (isLoading) {
            return (
                <div className='w-80 bg-white border-l border-gray-200 p-4 flex flex-col h-screen'>
                    <h2 className='text-lg font-semibold mb-4 flex items-center gap-2'>
                        <Calendar className='h-5 w-5' />
                        {new Date().toLocaleDateString('en-US', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                        })}
                    </h2>
                    <div className='space-y-3 flex-1'>
                        {[1, 2, 3].map((i) => (
                            <div key={i} className='animate-pulse bg-white p-3 rounded-lg border border-slate-200'>
                                <div className='h-4 bg-slate-200 rounded w-3/4 mb-2'></div>
                                <div className='h-3 bg-slate-200 rounded w-1/2'></div>
                            </div>
                        ))}
                    </div>
                </div>
            );
        }

        if (error) {
            return (
                <div className='w-80 bg-white border-l border-gray-200 p-4 flex flex-col h-screen'>
                    <h2 className='text-lg font-semibold mb-4 flex items-center gap-2'>
                        <Calendar className='h-5 w-5' />
                        {new Date().toLocaleDateString('en-US', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                        })}
                    </h2>
                    <div className='flex-1 flex items-center justify-center text-center text-muted-foreground'>
                        <p className='text-sm'>{error}</p>
                    </div>
                </div>
            );
        }

        return (
            <div
                ref={sidebarRef}
                className='w-80 bg-white border-l border-gray-200 flex flex-col h-screen focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset'
                tabIndex={-1}
                onKeyDown={handleKeyDown}
                onBlur={handleSidebarBlur}
            >
                <h2 className='text-lg p-4 font-semibold flex items-center gap-2'>
                    <Calendar className='h-5 w-5' />
                    {new Date().toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                    })}
                </h2>

                {/* Office Time Button */}
                <div className='p-4 border-t border-slate-200'>
                    <button
                        ref={officeTimeButtonRef}
                        onClick={handleOfficeTimeClick}
                        className='w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white rounded-lg py-2 px-4 transition-colors'
                    >
                        <Plus className='h-4 w-4' />
                        <span className='text-sm font-medium'>
                            {dailyWorkTime ? `Office Time: ${formatTime(dailyWorkTime)}` : 'Add Office Time'}
                        </span>
                    </button>
                </div>

                {entries.length === 0 ? (
                    <div className='flex-1 p-4 flex items-center justify-center text-center text-muted-foreground'>
                        <div>
                            <Clock className='h-8 w-8 mx-auto opacity-50' />
                            <p className='text-sm'>No entries for today</p>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Total Hours Summary */}
                        <div className='mx-4 p-3 bg-blue-50 border border-blue-100 rounded-lg flex-shrink-0'>
                            <div className='flex items-center justify-between'>
                                <span className='text-sm font-medium'>Total Task Hours</span>
                                <span className='text-lg font-bold'>{formatTime(getTotalHours())}</span>
                            </div>
                        </div>

                        {/* Time Entries List */}
                        <div className='space-y-3 py-2 px-4 overflow-y-auto flex-1'>
                            {entries.map((entry, index) => (
                                <button
                                    key={entry.id}
                                    onClick={(e) => handleEditEntry(entry, e)}
                                    className={`w-full border border-slate-200 rounded-lg p-3 bg-white hover:bg-slate-50 transition-colors shadow-sm text-left cursor-pointer ${
                                        isSidebarFocused && focusedIndex === index
                                            ? 'ring-2 ring-blue-500 bg-blue-50'
                                            : ''
                                    }`}
                                >
                                    {/* Date with Calendar Icon */}
                                    <div className='flex items-center gap-1 text-xs text-muted-foreground mb-2'>
                                        <Calendar className='h-3 w-3' />
                                        <span>
                                            {entry.category?.type === 'day'
                                                ? formatDate(entry.date, entry.endDate)
                                                : formatDate(entry.date)}
                                        </span>
                                    </div>

                                    {/* Header */}
                                    <div className='flex items-start justify-between mb-2'>
                                        <div className='flex items-center gap-2 flex-1 min-w-0'>
                                            {entry.jiraKey ? (
                                                <Briefcase className='h-4 w-4 text-blue-600 flex-shrink-0' />
                                            ) : (
                                                <Tag className='h-4 w-4 text-green-600 flex-shrink-0' />
                                            )}
                                            <span className='font-medium text-sm truncate'>
                                                {entry.jiraKey || entry.category?.name}
                                            </span>
                                        </div>
                                        {entry.hours && (
                                            <span className='text-xs font-mono bg-slate-100 text-slate-700 px-2 py-1 rounded'>
                                                {formatTime(entry.hours)}
                                            </span>
                                        )}
                                    </div>

                                    {/* Details */}
                                    <div className='space-y-1'>
                                        {entry.jiraBillingPackage && (
                                            <div className='text-xs text-blue-600'>{entry.jiraBillingPackage}</div>
                                        )}

                                        {entry.description && (
                                            <div className='text-xs text-muted-foreground mt-1 line-clamp-2'>
                                                {entry.description}
                                            </div>
                                        )}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </>
                )}

                {/* Edit Popover */}
                {editingEntry && (
                    <TimeEntryEditPopover
                        entry={editingEntry}
                        isOpen={!!editingEntry}
                        onClose={handleClosePopover}
                        onSave={handleSaveEntry}
                        position={popoverPosition}
                    />
                )}

                {/* Office Time Popover */}
                <OfficeTimePopover
                    isOpen={showOfficeTimePopover}
                    onClose={() => setShowOfficeTimePopover(false)}
                    onSave={handleSaveOfficeTime}
                    position={officeTimePopoverPosition}
                    currentValue={dailyWorkTime}
                />
            </div>
        );
    }
);

TimeEntriesSidebar.displayName = 'TimeEntriesSidebar';
