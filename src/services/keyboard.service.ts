// Keyboard Service - Implements Single Responsibility Principle

export interface KeyboardShortcut {
  key: string
  ctrlKey?: boolean
  shiftKey?: boolean
  altKey?: boolean
  metaKey?: boolean
  callback: (event: KeyboardEvent) => void
}

export interface KeyboardServiceInterface {
  registerShortcut(shortcut: KeyboardShortcut): () => void
  detectPlatform(): { isMac: boolean }
}

export class KeyboardService implements KeyboardServiceInterface {
  private shortcuts: Map<string, KeyboardShortcut> = new Map()

  registerShortcut(shortcut: KeyboardShortcut): () => void {
    const key = this.createShortcutKey(shortcut)
    this.shortcuts.set(key, shortcut)

    const handleKeyDown = (event: KeyboardEvent) => {
      if (this.matchesShortcut(event, shortcut)) {
        event.preventDefault()
        shortcut.callback(event)
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    // Return cleanup function
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      this.shortcuts.delete(key)
    }
  }

  detectPlatform(): { isMac: boolean } {
    const platform = navigator.platform || navigator.userAgent
    return {
      isMac: /Mac|iPhone|iPod|iPad/i.test(platform)
    }
  }

  private createShortcutKey(shortcut: KeyboardShortcut): string {
    const parts = []
    if (shortcut.ctrlKey) parts.push('ctrl')
    if (shortcut.shiftKey) parts.push('shift')
    if (shortcut.altKey) parts.push('alt')
    if (shortcut.metaKey) parts.push('meta')
    parts.push(shortcut.key.toLowerCase())
    return parts.join('+')
  }

  private matchesShortcut(event: KeyboardEvent, shortcut: KeyboardShortcut): boolean {
    return (
      event.key.toLowerCase() === shortcut.key.toLowerCase() &&
      !!event.ctrlKey === !!shortcut.ctrlKey &&
      !!event.shiftKey === !!shortcut.shiftKey &&
      !!event.altKey === !!shortcut.altKey &&
      !!event.metaKey === !!shortcut.metaKey
    )
  }
}

// Factory function
export const createKeyboardService = (): KeyboardServiceInterface => {
  return new KeyboardService()
}