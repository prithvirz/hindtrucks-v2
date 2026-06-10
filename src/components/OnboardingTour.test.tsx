import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ShellCtx } from '../state/ShellContext'
import OnboardingTour from './OnboardingTour'

interface RenderTourOptions {
    isTourActive?: boolean
    tourStep?: number
}

function renderTour(options: RenderTourOptions = {}) {
    const { isTourActive = true, tourStep = 0 } = options
    const mockEndTour = vi.fn()
    const mockSetTourStep = vi.fn()
    const mockStartTour = vi.fn()

    const shellValue = {
        isTourActive,
        tourStep,
        setTourStep: mockSetTourStep,
        hasSeenTour: false,
        isLoading: false,
        error: null,
        startTour: mockStartTour,
        endTour: mockEndTour,
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

    const result = render(
        <ShellCtx.Provider value={shellValue}>
            <OnboardingTour />
        </ShellCtx.Provider>,
    )

    return {
        ...result,
        mockEndTour,
        mockSetTourStep,
        mockStartTour,
        user: userEvent.setup(),
    }
}

describe('OnboardingTour', () => {
    it('renders tour dialog when tourActive is true', () => {
        renderTour({ isTourActive: true })
        expect(screen.getByRole('button', { name: /skip/i })).toBeInTheDocument()
    })

    it('renders tour step title and content', () => {
        renderTour({ isTourActive: true, tourStep: 0 })
        expect(screen.getByText('tour.welcome.title')).toBeInTheDocument()
        expect(screen.getByText('tour.welcome.content')).toBeInTheDocument()
    })

    it('calls endTour when skip is clicked', async () => {
        const { mockEndTour, user } = renderTour({ isTourActive: true })
        await user.click(screen.getByRole('button', { name: /skip/i }))
        expect(mockEndTour).toHaveBeenCalled()
    })
})