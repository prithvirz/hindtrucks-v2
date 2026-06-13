import { screen } from '@testing-library/react'
import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Profile from './Profile'

const mockDriver = {
    name: 'Rajbir Singh',
    phone: '+91 98765 43210',
    rating: 4.8,
    avatarId: '1633332755192-727a05c4013d',
    truck: { regNumber: 'PB10 AB 4521', type: '19 ft Container', capacity: '9 Ton' },
    documents: {
        license: { id: 'DL-0420 1198 7654', validity: '15-08-2035' },
        rc: { id: 'PB10 AB 4521', validity: '12-10-2031' },
        permit: { id: 'NP-2026-PB-8841', validity: '31-12-2030' },
    },
    trucks: [
        { id: '1', regNumber: 'PB10 AB 4521', type: '19 ft Container', capacity: '9 Ton', isActive: true },
    ],
}

vi.mock('../state/AuthContext', () => ({
    useAuth: () => ({ logout: vi.fn() }),
}))

vi.mock('../state/ProfileContext', () => ({
    useProfile: () => ({
        driver: mockDriver,
        isOnline: false,
        setOnline: vi.fn(),
        updateDriver: vi.fn(),
        addTruck: vi.fn(),
        removeTruck: vi.fn(),
        setActiveTruck: vi.fn(),
        role: 'driver',
        setRole: vi.fn(),
        drivers: [],
        addDriver: vi.fn(),
        removeDriver: vi.fn(),
        assignDriverToTruck: vi.fn(),
        toggleTruckActive: vi.fn(),
    }),
}))

vi.mock('../state/ShellContext', () => ({
    useShell: () => ({
        startTour: vi.fn(),
        pushNotifications: [],
        unreadPushCount: 0,
        markPushRead: vi.fn(),
        markAllPushRead: vi.fn(),
        deletePushNotification: vi.fn(),
    }),
}))

vi.mock('../state/ChatContext', () => ({
    useChatContext: () => ({ openChat: vi.fn() }),
}))

function renderProfile() {
    return render(
        <MemoryRouter>
            <Profile />
        </MemoryRouter>
    )
}

describe('Profile Screen', () => {
    it('renders profile title', () => {
        renderProfile()
        expect(screen.getByText('profile.title')).toBeInTheDocument()
    })

    it('renders referral section', () => {
        renderProfile()
        expect(screen.getByText('home.referTitle')).toBeInTheDocument()
    })

    it('renders referral link text', () => {
        renderProfile()
        const linkText = screen.getByText(/hindtrucks\.in\/refer\//i)
        expect(linkText).toBeInTheDocument()
    })
})
