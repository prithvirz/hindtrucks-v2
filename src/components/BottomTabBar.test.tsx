import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

import { NotificationContext, type NotificationContextValue } from '../state/NotificationContext'
import BottomTabBar from './BottomTabBar'

const mockNotificationValue: NotificationContextValue = {
    permissionState: { push: 'granted' as PermissionState, needsPrompt: false, promptedBefore: true },
    isPermissionGranted: true,
    isPermissionDenied: false,
    requestPermission: vi.fn(),
    fcmToken: null,
    isTokenLoading: false,
    notifications: [],
    unreadCount: 0,
    activeBanner: null,
    markRead: vi.fn(),
    markAllRead: vi.fn(),
    deleteNotification: vi.fn(),
    dismissBanner: vi.fn(),
    refreshHistory: vi.fn(),
}

describe('BottomTabBar', () => {
    function renderWithRouter(route = '/home') {
        return render(
            <MemoryRouter initialEntries={[route]}>
                <NotificationContext.Provider value={mockNotificationValue}>
                    <BottomTabBar />
                </NotificationContext.Provider>
            </MemoryRouter>,
        )
    }

    it('renders 4 tab links', () => {
        renderWithRouter()
        const links = screen.getAllByRole('link')
        expect(links).toHaveLength(4)
    })

    it('renders tab labels', () => {
        renderWithRouter()
        expect(screen.getByText('tabs.home')).toBeInTheDocument()
        expect(screen.getByText('tabs.loads')).toBeInTheDocument()
        expect(screen.getByText('tabs.earnings')).toBeInTheDocument()
        expect(screen.getByText('tabs.profile')).toBeInTheDocument()
    })

    it('highlights active tab', () => {
        renderWithRouter('/earnings')
        const earningsLink = screen.getByText('tabs.earnings').closest('a')
        expect(earningsLink?.className).toContain('text-accent')
    })
})