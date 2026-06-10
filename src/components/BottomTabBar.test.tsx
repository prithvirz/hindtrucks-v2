import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

import { ShellCtx } from '../state/ShellContext'
import BottomTabBar from './BottomTabBar'

const mockShellValue = {
    hasSeenTour: false,
    isTourActive: false,
    tourStep: 0,
    isLoading: false,
    error: null,
    startTour: vi.fn(),
    endTour: vi.fn(),
    setTourStep: vi.fn(),
    notification: null,
    showNotification: vi.fn(),
    dismissNotification: vi.fn(),
    isOnline: true,
    wasOffline: false,
    offlineQueueSize: 0,
    syncStatus: 'idle' as const,
    syncQueue: vi.fn(),
    pushPermissionState: { push: 'prompt' as PermissionState, needsPrompt: false, promptedBefore: false },
    subscribeToPush: vi.fn(),
    unsubscribeFromPush: vi.fn(),
    pushNotifications: [],
    unreadPushCount: 0,
    markPushRead: vi.fn(),
    markAllPushRead: vi.fn(),
    deletePushNotification: vi.fn(),
    activePushBanner: null,
    dismissPushBanner: vi.fn(),
}

describe('BottomTabBar', () => {
    function renderWithRouter(route = '/home') {
        return render(
            <MemoryRouter initialEntries={[route]}>
                <ShellCtx.Provider value={mockShellValue}>
                    <BottomTabBar />
                </ShellCtx.Provider>
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