import { screen, fireEvent } from '@testing-library/react'
import { renderWithProviders } from '../__tests__/test-utils'
import Register from './Register'

describe('Register Screen', () => {
    it('renders register screen header and elements', () => {
        renderWithProviders(<Register />)
        expect(screen.getByText('Welcome to HindTrucks!')).toBeInTheDocument()
        expect(screen.getByRole('button', { name: 'Next: Truck Details' })).toBeInTheDocument()
    })

    it('renders role selectors for Driver and Fleet Owner', () => {
        renderWithProviders(<Register />)
        expect(screen.getByText('Driver', { selector: 'p' })).toBeInTheDocument()
        expect(screen.getByText('Fleet Owner', { selector: 'p' })).toBeInTheDocument()
    })

    it('disables Next: Truck Details button when inputs are empty', () => {
        renderWithProviders(<Register />)
        const btn = screen.getByRole('button', { name: 'Next: Truck Details' })
        expect(btn).toBeDisabled()
    })

    it('shows license field in Driver mode and hides company name', () => {
        renderWithProviders(<Register />)
        expect(screen.getByPlaceholderText('e.g. DL-14201234567')).toBeInTheDocument()
        expect(screen.queryByPlaceholderText('e.g. Shergill Logistics')).not.toBeInTheDocument()
    })

    it('shows company name field in Fleet Owner mode and hides license', async () => {
        const { user } = renderWithProviders(<Register />)

        const ownerCard = screen.getByText('Fleet Owner', { selector: 'p' })
        await user.click(ownerCard)

        expect(screen.getByPlaceholderText('e.g. Shergill Logistics')).toBeInTheDocument()
        expect(screen.queryByPlaceholderText('e.g. DL-14201234567')).not.toBeInTheDocument()
    })

    it('completes the 2-step registration flow in Driver mode', () => {
        renderWithProviders(<Register />)

        // Step 1: Personal details
        fireEvent.change(screen.getByPlaceholderText('e.g. Rajesh Kumar'), { target: { value: 'Jaspreet Singh' } })
        fireEvent.change(screen.getByPlaceholderText('e.g. DL-14201234567'), { target: { value: 'DL-14202345678' } })

        const nextBtn = screen.getByRole('button', { name: 'Next: Truck Details' })
        expect(nextBtn).not.toBeDisabled()
        fireEvent.click(nextBtn)

        // Step 2: Truck details
        fireEvent.change(screen.getByPlaceholderText('e.g. PB10 AB 4521'), { target: { value: 'PB12 AB 9999' } })

        const submitBtn = screen.getByRole('button', { name: 'Create Account' })
        expect(submitBtn).not.toBeDisabled()
    })

    it('completes the 2-step registration flow in Fleet Owner mode', () => {
        renderWithProviders(<Register />)

        fireEvent.click(screen.getByText('Fleet Owner', { selector: 'p' }))

        // Step 1: Personal details (company name instead of license)
        fireEvent.change(screen.getByPlaceholderText('e.g. Rajesh Kumar'), { target: { value: 'Harman Singh' } })
        fireEvent.change(screen.getByPlaceholderText('e.g. Shergill Logistics'), { target: { value: 'Harman Fleet Group' } })

        const nextBtn = screen.getByRole('button', { name: 'Next: Truck Details' })
        expect(nextBtn).not.toBeDisabled()
        fireEvent.click(nextBtn)

        // Step 2: Truck details
        fireEvent.change(screen.getByPlaceholderText('e.g. PB10 AB 4521'), { target: { value: 'PB12 AB 8888' } })

        const submitBtn = screen.getByRole('button', { name: 'Create Account' })
        expect(submitBtn).not.toBeDisabled()
    })
})
