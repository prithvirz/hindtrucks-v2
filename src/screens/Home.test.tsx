import { screen } from '@testing-library/react'
import { renderWithProviders } from '../__tests__/test-utils'
import Home from './Home'

describe('Home Screen', () => {
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

    it('renders referral section', () => {
        renderWithProviders(<Home />)
        expect(screen.getByText('home.referTitle')).toBeInTheDocument()
    })

    it('renders referral link text', () => {
        renderWithProviders(<Home />)
        const linkText = screen.getByText(/hindtrucks\.in\/refer\//i)
        expect(linkText).toBeInTheDocument()
    })
})