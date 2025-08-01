'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Clock } from 'lucide-react';
import { TimeInput } from '@/components/ui/time-input';
import type { TimeInputRef } from '@/components/ui/time-input';

interface OfficeTimePopoverProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (totalHours: number) => Promise<void>;
    position: { x: number; y: number };
    currentValue?: number | null;
}

export function OfficeTimePopover({ isOpen, onClose, onSave, position, currentValue }: OfficeTimePopoverProps) {
    const [timeValue, setTimeValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const timeInputRef = useRef<TimeInputRef>(null);

    useEffect(() => {
        if (isOpen) {
            // Set initial value if exists
            if (currentValue) {
                const hours = Math.floor(currentValue);
                const minutes = Math.round((currentValue - hours) * 60);
                setTimeValue(minutes > 0 ? `${hours}h${minutes}m` : `${hours}h`);
            } else {
                setTimeValue('');
            }
            setError(null);
            
            // Focus the time input when popover opens
            setTimeout(() => {
                timeInputRef.current?.focus();
            }, 100);
        }
    }, [isOpen, currentValue]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!timeValue.trim()) {
            setError('Please enter the total office time');
            return;
        }

        // Parse the time value
        const timeRegex = /^(?:(\d+)h(?:(\d+)m)?|(\d+)m)$/i;
        const match = timeValue.toLowerCase().replace(/\s/g, '').match(timeRegex);
        
        if (!match) {
            setError('Invalid time format. Use format like 8h or 8h30m');
            return;
        }

        const hours = match[1] ? parseInt(match[1], 10) : 0;
        const minutes = match[2] ? parseInt(match[2], 10) : match[3] ? parseInt(match[3], 10) : 0;
        const totalHours = hours + (minutes / 60);

        if (totalHours === 0) {
            setError('Time must be greater than 0');
            return;
        }

        if (totalHours > 24) {
            setError('Time cannot exceed 24 hours');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            await onSave(totalHours);
            onClose();
        } catch (error) {
            console.error('Error saving office time:', error);
            setError('Failed to save office time');
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Escape') {
            e.preventDefault();
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop */}
            <div className='fixed inset-0 bg-black/20' onClick={onClose} />

            {/* Popover */}
            <div
                className='fixed z-50 bg-white rounded-lg shadow-lg border border-slate-200 p-4 w-80'
                style={{ left: position.x, top: position.y }}
                onKeyDown={handleKeyDown}
            >
                <div className='flex items-center justify-between mb-4'>
                    <h3 className='text-lg font-semibold flex items-center gap-2'>
                        <Clock className='h-5 w-5 text-green-600' />
                        Total Office Time
                    </h3>
                    <button
                        onClick={onClose}
                        className='text-gray-400 hover:text-gray-600 transition-colors'
                    >
                        <X className='h-5 w-5' />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className='space-y-4'>
                    <div>
                        <label className='block text-sm font-medium text-gray-700 mb-1'>
                            Hours worked in office today
                        </label>
                        <TimeInput
                            ref={timeInputRef}
                            value={timeValue}
                            onChange={setTimeValue}
                            placeholder='e.g., 8h or 8h30m'
                            required
                        />
                        {error && (
                            <p className='mt-1 text-sm text-red-600'>{error}</p>
                        )}
                    </div>

                    <div className='flex gap-2 justify-end'>
                        <button
                            type='button'
                            onClick={onClose}
                            className='px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors'
                        >
                            Cancel
                        </button>
                        <button
                            type='submit'
                            disabled={isLoading}
                            className='px-3 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
                        >
                            {isLoading ? 'Saving...' : 'Save'}
                        </button>
                    </div>
                </form>
            </div>
        </>
    );
}