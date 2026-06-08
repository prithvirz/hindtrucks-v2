import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '../__tests__/test-utils'
import Register from './Register'

describe('Register Screen', () => {
    beforeEach(() => {
        localStorage.clear()
    })

    it('renders only name and phone fields for first registration', () => {
        renderWithProviders(<Register />)
        expect(screen.getByText('register.welcomeTitle')).toBeInTheDocument()
        expect(screen.getByPlaceholderText('register.fullNamePlaceholder')).toBeInTheDocument()
        expect(screen.getByPlaceholderText('98765 43210')).toBeInTheDocument()
        expect(screen.queryByPlaceholderText('register.truckRegPlaceholder')).not.toBeInTheDocument()
        expect(screen.queryByPlaceholderText('register.licensePlaceholder')).not.toBeInTheDocument()
    })

    it('keeps Create Account disabled until name and phone are valid', async () => {
        renderWithProviders(<Register />)
        const button = screen.getByRole('button', { name: 'register.createAccount' })
        expect(button).toBeDisabled()

        await userEvent.type(screen.getByPlaceholderText('register.fullNamePlaceholder'), 'Jaspreet Singh')
        expect(button).toBeDisabled()

        await userEvent.type(screen.getByPlaceholderText('98765 43210'), '9876543210')
        expect(button).not.toBeDisabled()
    })
})
