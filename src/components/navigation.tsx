'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Clock, Calendar, BarChart3 } from 'lucide-react';

export function Navigation() {
    const pathname = usePathname();

    const isActive = (path: string) => pathname === path;

    return (
        <nav className='bg-white border-b border-slate-200'>
            <div className='container mx-auto px-4'>
                <div className='flex items-center justify-between h-16'>
                    <div className='flex items-center'>
                        <h1 className='text-xl font-bold text-slate-900'>Time Tracker</h1>
                    </div>
                    <div className='flex space-x-8'>
                        <Link
                            href='/'
                            className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                                isActive('/')
                                    ? 'text-blue-600 bg-blue-50'
                                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                            }`}
                        >
                            <Clock className='h-4 w-4' />
                            Time Tracking
                        </Link>
                        <Link
                            href='/tracked-time'
                            className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                                isActive('/tracked-time')
                                    ? 'text-blue-600 bg-blue-50'
                                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                            }`}
                        >
                            <Calendar className='h-4 w-4' />
                            Tracked Time
                        </Link>
                        <Link
                            href='/daily-timetracking'
                            className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                                isActive('/daily-timetracking')
                                    ? 'text-blue-600 bg-blue-50'
                                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                            }`}
                        >
                            <BarChart3 className='h-4 w-4' />
                            JIRA Task Accounting
                        </Link>
                    </div>
                </div>
            </div>
        </nav>
    );
}