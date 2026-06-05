import { screen } from '@testing-library/react'
import { renderWithProviders } from '../__tests__/test-utils'
import Profile from './Profile'

describe('Profile Screen', () => {
    it('renders profile title', () => {
        renderWithProviders(<Profile />)
        expect(screen.getByText('profile.title')).toBeInTheDocument()
    })

    it('renders referral section', () => {
        renderWithProviders(<Profile />)
        expect(screen.getByText('home.referTitle')).toBeInTheDocument()
    })

    it('renders referral link text', () => {
        renderWithProviders(<Profile />)
        const linkText = screen.getByText(/hindtrucks\.in\/refer\//i)
        expect(linkText).toBeInTheDocument()
    })
})
