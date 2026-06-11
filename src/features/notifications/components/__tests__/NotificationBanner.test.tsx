// ─── NotificationBanner.test.tsx ───

import { render, screen, fireEvent } from '@testing-library/react'
import { NotificationBanner } from '../NotificationBanner'
import type { PushNotification, NotificationType } from '../../types'

function createNotification(type: NotificationType, overrides: Partial<PushNotification> = {}): PushNotification {
    return {
        id: 'notif-1',
        type,
        title: 'Test Notification',
        body: 'This is a test notification body.',
        read: false,
        receivedAt: Date.now(),
        ...overrides,
    }
}

describe('NotificationBanner', () => {
    beforeEach(() => {
        vi.useFakeTimers()
    })

    afterEach(() => {
        vi.useRealTimers()
    })

    it('renders notification title and body', () => {
        const onDismiss = vi.fn()
        const onTap = vi.fn()

        render(
            <NotificationBanner
                notification={createNotification('new_load')}
                onDismiss={onDismiss}
                onTap={onTap}
            />,
        )

        expect(screen.getByText('Test Notification')).toBeTruthy()
        expect(screen.getByText('This is a test notification body.')).toBeTruthy()
    })

    it('calls onDismiss after 8 seconds', () => {
        const onDismiss = vi.fn()
        const onTap = vi.fn()

        render(
            <NotificationBanner
                notification={createNotification('accepted')}
                onDismiss={onDismiss}
                onTap={onTap}
            />,
        )

        expect(onDismiss).not.toHaveBeenCalled()

        vi.advanceTimersByTime(8000)

        expect(onDismiss).toHaveBeenCalledTimes(1)
    })

    it('calls onTap with deepLink when clicked', () => {
        const onDismiss = vi.fn()
        const onTap = vi.fn()

        render(
            <NotificationBanner
                notification={createNotification('earnings', { deepLink: '/earnings/123' })}
                onDismiss={onDismiss}
                onTap={onTap}
            />,
        )

        fireEvent.click(screen.getByText('Test Notification').closest('div')!)

        expect(onTap).toHaveBeenCalledWith('/earnings/123')
    })

    it('dismiss button calls onDismiss without onTap', () => {
        const onDismiss = vi.fn()
        const onTap = vi.fn()

        render(
            <NotificationBanner
                notification={createNotification('chat_message')}
                onDismiss={onDismiss}
                onTap={onTap}
            />,
        )

        const dismissBtn = screen.getByRole('button', { name: 'Dismiss' })
        fireEvent.click(dismissBtn)

        expect(onDismiss).toHaveBeenCalledTimes(1)
        expect(onTap).not.toHaveBeenCalled()
    })

    // Test all 9 notification types render without error
    const allTypes: NotificationType[] = [
        'new_load', 'accepted', 'status_update', 'earnings',
        'announcement', 'trip_reminder', 'geofence_alert',
        'chat_message', 'system_announcement',
    ]

    allTypes.forEach((type) => {
        it(`renders ${type} notification without error`, () => {
            const { container } = render(
                <NotificationBanner
                    notification={createNotification(type)}
                    onDismiss={vi.fn()}
                    onTap={vi.fn()}
                />,
            )
            expect(container.firstChild).toBeTruthy()
        })
    })

    it('cleans up timeout on unmount', () => {
        const onDismiss = vi.fn()
        const onTap = vi.fn()

        const { unmount } = render(
            <NotificationBanner
                notification={createNotification('announcement')}
                onDismiss={onDismiss}
                onTap={onTap}
            />,
        )

        unmount()
        vi.advanceTimersByTime(8000)

        // Should not call onDismiss after unmount
        expect(onDismiss).not.toHaveBeenCalled()
    })
})