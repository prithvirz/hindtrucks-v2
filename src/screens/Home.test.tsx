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

})