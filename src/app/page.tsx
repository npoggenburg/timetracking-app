'use client';

import { useState, useRef, useEffect } from 'react';
import { TimeEntryForm } from '@/components/time-entry-form';
import { TimeEntriesSidebar, TimeEntriesSidebarRef } from '@/components/time-entries-sidebar';
import { ConfirmationModal } from '@/components/ui/confirmation-modal';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { 
    TimeEntryData, 
    TimeEntryServiceInterface, 
    createTimeEntryService 
} from '@/services/time-entry.service';
import { 
    NotificationMessage, 
    NotificationServiceInterface, 
    createNotificationService 
} from '@/services/notification.service';
import { 
    KeyboardServiceInterface, 
    createKeyboardService 
} from '@/services/keyboard.service';

export default function Home() {
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState<NotificationMessage | null>(null);
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [showClearConfirmation, setShowClearConfirmation] = useState(false);
    const [isClearing, setIsClearing] = useState(false);
    const sidebarRef = useRef<TimeEntriesSidebarRef>(null);

    // Services - Dependency Injection
    const timeEntryService = useRef<TimeEntryServiceInterface>(createTimeEntryService());
    const notificationService = useRef<NotificationServiceInterface>(createNotificationService());
    const keyboardService = useRef<KeyboardServiceInterface>(createKeyboardService());

    const handleTimeEntrySubmit = async (data: TimeEntryData) => {
        setIsLoading(true);
        setMessage(null);

        const result = await timeEntryService.current.createTimeEntry(data);

        if (result.success) {
            setMessage(notificationService.current.createMessage('success', 'Time entry added successfully!'));
            setRefreshTrigger((prev) => prev + 1); // Trigger sidebar refresh
            console.log('Time entry created:', result.data);
        } else {
            setMessage(notificationService.current.createMessage('error', result.error || 'Failed to create time entry'));
        }

        setIsLoading(false);
    };

    const handleClearEntries = async () => {
        setIsClearing(true);
        setMessage(null);

        const result = await timeEntryService.current.clearAllEntries();

        if (result.success && result.data) {
            setMessage(notificationService.current.createMessage(
                'success', 
                `Successfully cleared ${result.data.count} time entries`
            ));
            setRefreshTrigger((prev) => prev + 1); // Trigger sidebar refresh
            setShowClearConfirmation(false);
        } else {
            setMessage(notificationService.current.createMessage('error', result.error || 'Failed to clear entries'));
        }

        setIsClearing(false);
    };

    // Keyboard shortcut for focusing sidebar
    useEffect(() => {
        const cleanup = keyboardService.current.registerShortcut({
            key: 'm',
            ctrlKey: true,
            shiftKey: true,
            callback: () => {
                sidebarRef.current?.focus();
            }
        });

        return cleanup;
    }, []);

    return (
        <div className='flex'>
            {/* Main Content */}
            <div className='flex-1'>
                <div className='container mx-auto px-4 py-8 max-w-4xl'>
                    {/* Header */}
                    <div className='mb-8'>
                        <h1 className='text-3xl font-bold mb-4'>Time Tracking</h1>
                        <p className='text-gray-600'>Track your time on JIRA tasks and internal activities</p>
                    </div>

                    {message && (
                        <div
                            className={`mb-6 rounded-md border px-4 py-3 ${
                                message.type === 'success'
                                    ? 'border-green-200 bg-green-50 text-green-800'
                                    : 'border-red-200 bg-red-50 text-red-800'
                            }`}
                        >
                            {message.text}
                        </div>
                    )}

                    <div className='bg-white rounded-lg shadow border border-gray-200 p-6'>
                        <TimeEntryForm onSubmit={handleTimeEntrySubmit} isLoading={isLoading} />
                    </div>

                    <footer className='mt-8 text-center'>
                        <Button
                            variant="outline"
                            onClick={() => setShowClearConfirmation(true)}
                            disabled={isClearing}
                            className="text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
                        >
                            <Trash2 className="h-4 w-4 mr-2" />
                            {isClearing ? 'Clearing...' : 'Clear All Entries'}
                        </Button>
                    </footer>
                </div>
            </div>

            {/* Right Sidebar */}
            <TimeEntriesSidebar ref={sidebarRef} refreshTrigger={refreshTrigger} />

            {/* Clear Confirmation Modal */}
            <ConfirmationModal
                isOpen={showClearConfirmation}
                title="Clear All Time Entries"
                message="Are you sure you want to delete all time entries? This action cannot be undone."
                onConfirm={handleClearEntries}
                onCancel={() => setShowClearConfirmation(false)}
                confirmText="Clear All"
                cancelText="Cancel"
            />
        </div>
    );
}
