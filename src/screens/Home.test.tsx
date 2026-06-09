import { screen } from '@testing-library/react'
import { renderWithProviders } from '../__tests__/test-utils'
import Home from './Home'

describe('Home Screen', () => {
    beforeEach(() => {
        localStorage.clear()
    })

    it('renders driver name', () => {
        renderWithProviders(<Home />)
        expect(screen.getAllByText('Rajbir Singh').length).toBeGreaterThan(0)
    })

    it('renders stats card', () => {
        renderWithProviders(<Home />)
        const statsCard = document.getElementById('stats-card')
        expect(statsCard).toBeInTheDocument()
    })

    it('renders BFC leaderboard title', () => {
        renderWithProviders(<Home />)
        expect(screen.getByText('home.bfcTitle')).toBeInTheDocument()
    })

    it('shows the current account in the leaderboard without a demo truck', () => {
        localStorage.setItem('ht_auth', '1')
        localStorage.setItem('ht_phone', '9123456701')
        localStorage.setItem('ht_driver_9123456701', JSON.stringify({
            name: 'Apex Testuser',
            phone: '9123456701',
            rating: 5,
            tripsToday: 0,
            earningsToday: 0,
            walletBalance: 0,
            truck: { regNumber: '', type: '', capacity: '' },
            documents: {
                license: { id: 'PENDING', validity: '' },
                rc: { id: 'PENDING', validity: '' },
                permit: { id: 'PENDING', validity: '' },
            },
            trucks: [],
        }))

        renderWithProviders(<Home />)

        const currentMember = screen
            .getAllByText('Apex Testuser')
            .map((el) => el.closest('.bfc-member'))
            .find(Boolean)

        expect(currentMember).toHaveTextContent('You')
        expect(currentMember).toHaveTextContent('profile.truckPending')
        expect(currentMember).not.toHaveTextContent('PB10 AB 4521')
    })
})
