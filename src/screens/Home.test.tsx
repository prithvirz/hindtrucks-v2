import { screen } from '@testing-library/react'
import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Home from './Home'

vi.mock('../state/ProfileContext', () => ({
    useProfile: () => ({
        isOnline: false,
        setOnline: vi.fn(),
        role: 'driver',
        drivers: [],
        driver: {
            name: 'Rajbir Singh',
            rating: 4.8,
            tripsToday: 2,
            earningsToday: 23800,
            truck: { regNumber: 'PB10 AB 4521', type: '19 ft Container', capacity: '9 Ton' },
            trucks: [
                { id: '1', regNumber: 'PB10 AB 4521', type: '19 ft Container', capacity: '9 Ton', isActive: true },
            ],
        },
    }),
}))

vi.mock('../state/TripContext', () => ({
    useTrip: () => ({
        activeTrips: [],
        activeLoad: null,
    }),
}))

function renderHome() {
    return render(
        <MemoryRouter>
            <Home />
        </MemoryRouter>
    )
}

describe('Home Screen', () => {
    it('renders driver name', () => {
        renderHome()
        expect(screen.getAllByText('Rajbir Singh').length).toBeGreaterThan(0)
    })

    it('renders stats card', () => {
        renderHome()
        const statsCard = document.getElementById('stats-card')
        expect(statsCard).toBeInTheDocument()
    })

    it('renders BFC leaderboard title', () => {
        renderHome()
        expect(screen.getByText('home.bfcTitle')).toBeInTheDocument()
    })

})
