// ─── NotificationCenter.test.tsx ───

import { render, screen, fireEvent } from '@testing-library/react'
import { NotificationCenter } from '../NotificationCenter'
import type { PushNotification, NotificationType } from '../../types'

function createNotification(id: string, type: NotificationType, overrides: Partial<PushNotification> = {}): PushNotification {
    return {
        id,
        type,
        title: `Notification ${id}`,
        body: `Body for ${id}`,
        read: false,
        receivedAt: Date.now(),
        ...overrides,
    }
}

function createTestNotifications(): PushNotification[] {
    return [
        createNotification('1', 'new_load', { title: 'New Load: Mumbai-Delhi' }),
        createNotification('2', 'accepted', { title: 'Load Accepted', read: true }),
        createNotification('3', 'status_update', { title: 'Trip Started' }),
        createNotification('4', 'earnings', { title: 'Earnings Credited', read: true }),
        createNotification('5', 'chat_message', { title: 'Chat from Shipper' }),
    ]
}

describe('NotificationCenter', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    const defaultProps = {
        notifications: createTestNotifications(),
        unreadCount: 3,
        onMarkRead: vi.fn().mockResolvedValue(undefined),
        onMarkAllRead: vi.fn().mockResolvedValue(undefined),
        onDelete: vi.fn().mockResolvedValue(undefined),
        onClose: vi.fn(),
    }

    it('renders header with title', () => {
        render(<NotificationCenter {...defaultProps} />)

        expect(screen.getByText('notifications.center.title')).toBeTruthy()
    })

    it('calls onClose when back arrow clicked', () => {
        render(<NotificationCenter {...defaultProps} />)

        // First button is the back arrow
        const buttons = screen.getAllByRole('button')
        const backArrow = buttons.find(b => b.querySelector('.lucide-arrow-left'))
        expect(backArrow).toBeTruthy()
        if (backArrow) fireEvent.click(backArrow)

        expect(defaultProps.onClose).toHaveBeenCalled()
    })

    it('displays notification items', () => {
        render(<NotificationCenter {...defaultProps} />)

        expect(screen.getByText('New Load: Mumbai-Delhi')).toBeTruthy()
        expect(screen.getByText('Load Accepted')).toBeTruthy()
    })

    it('shows empty state when no notifications', () => {
        render(
            <NotificationCenter
                {...defaultProps}
                notifications={[]}
                unreadCount={0}
            />,
        )

        expect(screen.getByText('notifications.center.empty')).toBeTruthy()
    })

    it('renders all filter tabs', () => {
        render(<NotificationCenter {...defaultProps} />)

        // Filter labels are hardcoded in FILTERS array, not i18n
        // Buttons have names like "All5" (label + count), use regex
        expect(screen.getByRole('button', { name: /^All\d*$/ })).toBeTruthy()
        expect(screen.getByRole('button', { name: /^Loads\d*$/ })).toBeTruthy()
        expect(screen.getByRole('button', { name: /^Accepted\d*$/ })).toBeTruthy()
        expect(screen.getByRole('button', { name: /^Status\d*$/ })).toBeTruthy()
        expect(screen.getByRole('button', { name: /^Earnings\d*$/ })).toBeTruthy()
        expect(screen.getByRole('button', { name: /^Reminders\d*$/ })).toBeTruthy()
        expect(screen.getByRole('button', { name: /^Messages\d*$/ })).toBeTruthy()
        expect(screen.getByRole('button', { name: /^Announcements\d*$/ })).toBeTruthy()
        expect(screen.getByRole('button', { name: /^System\d*$/ })).toBeTruthy()
    })

    it('filters notifications by type when tab clicked', () => {
        render(<NotificationCenter {...defaultProps} />)

        // Click "Loads" filter
        fireEvent.click(screen.getByText('Loads'))

        // Should only show new_load notification
        expect(screen.getByText('New Load: Mumbai-Delhi')).toBeTruthy()
        expect(screen.queryByText('Load Accepted')).toBeNull()
    })

    it('shows per-filter empty state', () => {
        render(<NotificationCenter {...defaultProps} />)

        // Click "Reminders" filter (no trip_reminder notifications exist)
        fireEvent.click(screen.getByText('Reminders'))

        expect(screen.getByText('No trip reminders')).toBeTruthy()
        expect(screen.getByText('Upcoming trip reminders will appear here.')).toBeTruthy()
    })

    it('calls onMarkAllRead when mark-all button clicked', () => {
        render(<NotificationCenter {...defaultProps} />)

        // Find the mark-all-read button (CheckCheck icon)
        // It's the button with CheckCheck icon — find it
        const buttons = screen.getAllByRole('button')
        const markBtn = buttons.find(b =>
            b.className.includes('bg-accent-soft') && b.querySelector('.lucide-check-check'),
        )
        expect(markBtn).toBeTruthy()
        if (markBtn) fireEvent.click(markBtn)

        expect(defaultProps.onMarkAllRead).toHaveBeenCalled()
    })

    it('calls onMarkRead when unread notification clicked', () => {
        render(<NotificationCenter {...defaultProps} />)

        // Click the unread notification (New Load, id='1')
        fireEvent.click(screen.getByText('New Load: Mumbai-Delhi'))

        expect(defaultProps.onMarkRead).toHaveBeenCalledWith('1')
    })

    it('does not call onMarkRead for already-read notification', () => {
        render(<NotificationCenter {...defaultProps} />)

        // Click the read notification (Load Accepted, id='2')
        fireEvent.click(screen.getByText('Load Accepted'))

        expect(defaultProps.onMarkRead).not.toHaveBeenCalled()
    })

    it('calls onDelete when delete button clicked', () => {
        render(<NotificationCenter {...defaultProps} />)

        const deleteBtns = screen.getAllByRole('button', { name: 'Delete notification' })
        expect(deleteBtns.length).toBeGreaterThan(0)

        fireEvent.click(deleteBtns[0])

        expect(defaultProps.onDelete).toHaveBeenCalled()
    })

    it('shows filter counts', () => {
        const testNotifications = [
            createNotification('1', 'new_load', { title: 'L1' }),
            createNotification('2', 'new_load', { title: 'L2' }),
            createNotification('3', 'accepted', { title: 'A1' }),
        ]

        render(
            <NotificationCenter
                {...defaultProps}
                notifications={testNotifications}
            />,
        )

        // "All" should show count 3
        // "Loads" should show count 2
        // "Accepted" should show count 1
        // Just verify the filter bar renders counts
        expect(screen.getByText('All').parentElement?.textContent).toContain('3')
    })

    it('displays date group headers', () => {
        render(<NotificationCenter {...defaultProps} />)

        // All notifications use Date.now() so they'll be "Today"
        expect(screen.getByText('Today')).toBeTruthy()
    })

    it('renders all caught up footer when hasMore is false', () => {
        render(
            <NotificationCenter
                {...defaultProps}
                hasMore={false}
                notifications={createTestNotifications()}
            />,
        )

        expect(screen.getByText('All caught up')).toBeTruthy()
    })

    it('disables mark-all-read button when unreadCount is 0', () => {
        render(
            <NotificationCenter
                {...defaultProps}
                unreadCount={0}
            />,
        )

        // Find the mark-all button
        const buttons = screen.getAllByRole('button')
        const markBtn = buttons.find(b =>
            b.className.includes('bg-accent-soft') && b.querySelector('.lucide-check-check'),
        )
        expect(markBtn).toBeTruthy()
        if (markBtn) {
            expect(markBtn).toBeDisabled()
        }
    })
})