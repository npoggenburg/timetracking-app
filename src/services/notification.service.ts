// Notification Service - Implements Single Responsibility and Dependency Inversion

export interface NotificationMessage {
  type: 'success' | 'error' | 'warning' | 'info'
  text: string
}

export interface NotificationServiceInterface {
  showValidationError(message: string): void
  createMessage(type: NotificationMessage['type'], text: string): NotificationMessage
}

export class NotificationService implements NotificationServiceInterface {
  showValidationError(message: string): void {
    // Using alert for now, but this can be easily swapped for toast notifications
    alert(message)
  }

  createMessage(type: NotificationMessage['type'], text: string): NotificationMessage {
    return { type, text }
  }
}

// Alternative implementation using toast notifications (if needed later)
export class ToastNotificationService implements NotificationServiceInterface {
  showValidationError(message: string): void {
    // Future implementation for toast notifications
    console.warn('Validation Error:', message)
  }

  createMessage(type: NotificationMessage['type'], text: string): NotificationMessage {
    return { type, text }
  }
}

// Factory function for dependency injection
export const createNotificationService = (): NotificationServiceInterface => {
  return new NotificationService()
}