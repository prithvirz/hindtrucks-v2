import { screen, fireEvent } from '@testing-library/react'
import { renderWithProviders } from '../__tests__/test-utils'
import Register from './Register'

describe('Register Screen', () => {
    it('renders register screen header and elements', () => {
        renderWithProviders(<Register />)
        expect(screen.getByText('register.welcomeTitle')).toBeInTheDocument()
        expect(screen.getByRole('button', { name: 'register.nextTruckDetails' })).toBeInTheDocument()
    })

    it('renders role selectors for Driver and Fleet Owner', () => {
        renderWithProviders(<Register />)
        expect(screen.getByText('register.roles.driver.title', { selector: 'p' })).toBeInTheDocument()
        expect(screen.getByText('register.roles.owner.title', { selector: 'p' })).toBeInTheDocument()
    })

    it('disables Next: Truck Details button when inputs are empty', () => {
        renderWithProviders(<Register />)
        const btn = screen.getByRole('button', { name: 'register.nextTruckDetails' })
        expect(btn).toBeDisabled()
    })

    it('shows license field in Driver mode and hides company name', () => {
        renderWithProviders(<Register />)
        expect(screen.getByPlaceholderText('register.licensePlaceholder')).toBeInTheDocument()
        expect(screen.queryByPlaceholderText('register.companyPlaceholder')).not.toBeInTheDocument()
    })

    it('shows company name field in Fleet Owner mode and hides license', async () => {
        const { user } = renderWithProviders(<Register />)

        const ownerCard = screen.getByText('register.roles.owner.title', { selector: 'p' })
        await user.click(ownerCard)

        expect(screen.getByPlaceholderText('register.companyPlaceholder')).toBeInTheDocument()
        expect(screen.queryByPlaceholderText('register.licensePlaceholder')).not.toBeInTheDocument()
    })

    it('completes the 2-step registration flow in Driver mode', () => {
        renderWithProviders(<Register />)

        // Step 1: Personal details
        fireEvent.change(screen.getByPlaceholderText('register.fullNamePlaceholder'), { target: { value: 'Jaspreet Singh' } })
        fireEvent.change(screen.getByPlaceholderText('register.licensePlaceholder'), { target: { value: 'DL-14202345678' } })

        const nextBtn = screen.getByRole('button', { name: 'register.nextTruckDetails' })
        expect(nextBtn).not.toBeDisabled()
        fireEvent.click(nextBtn)

        // Step 2: Truck details
        fireEvent.change(screen.getByPlaceholderText('register.truckRegPlaceholder'), { target: { value: 'PB12 AB 9999' } })

        const submitBtn = screen.getByRole('button', { name: 'register.createAccount' })
        expect(submitBtn).not.toBeDisabled()
    })

    it('completes the 2-step registration flow in Fleet Owner mode', () => {
        renderWithProviders(<Register />)

        fireEvent.click(screen.getByText('register.roles.owner.title', { selector: 'p' }))

        // Step 1: Personal details (company name instead of license)
        fireEvent.change(screen.getByPlaceholderText('register.fullNamePlaceholder'), { target: { value: 'Harman Singh' } })
        fireEvent.change(screen.getByPlaceholderText('register.companyPlaceholder'), { target: { value: 'Harman Fleet Group' } })

        const nextBtn = screen.getByRole('button', { name: 'register.nextTruckDetails' })
        expect(nextBtn).not.toBeDisabled()
        fireEvent.click(nextBtn)

        // Step 2: Truck details
        fireEvent.change(screen.getByPlaceholderText('register.truckRegPlaceholder'), { target: { value: 'PB12 AB 8888' } })

        const submitBtn = screen.getByRole('button', { name: 'register.createAccount' })
        expect(submitBtn).not.toBeDisabled()
    })
})
