import { screen } from '@testing-library/react'
import { renderWithProviders } from '../__tests__/test-utils'
import Register from './Register'

describe('Register Screen', () => {
    it('renders register screen header and elements', () => {
        renderWithProviders(<Register />)
        expect(screen.getByRole('heading', { name: 'Create Account' })).toBeInTheDocument()
        expect(screen.getByText('Welcome to HindTrucks!')).toBeInTheDocument()
    })

    it('renders role selectors for Driver and Fleet Owner', () => {
        renderWithProviders(<Register />)
        expect(screen.getByText('Driver', { selector: 'p' })).toBeInTheDocument()
        expect(screen.getByText('Fleet Owner', { selector: 'p' })).toBeInTheDocument()
    })

    it('disables Create Account button when inputs are empty', () => {
        renderWithProviders(<Register />)
        const btn = screen.getByRole('button', { name: 'Create Account' })
        expect(btn).toBeDisabled()
    })

    it('shows license field in Driver mode and hides company name', async () => {
        renderWithProviders(<Register />)
        
        // Default is Driver Mode
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

    it('enables Create Account button when all inputs are valid in Driver mode', async () => {
        const { user } = renderWithProviders(<Register />)
        
        const nameInput = screen.getByPlaceholderText('e.g. Gurpreet Singh')
        const licenseInput = screen.getByPlaceholderText('e.g. DL-14201234567')
        const truckInput = screen.getByPlaceholderText('e.g. PB10 AB 4521')

        await user.type(nameInput, 'Jaspreet Singh')
        await user.type(licenseInput, 'DL-14202345678')
        await user.type(truckInput, 'PB12 AB 9999')

        const btn = screen.getByRole('button', { name: 'Create Account' })
        expect(btn).not.toBeDisabled()
    })

    it('enables Create Account button when all inputs are valid in Fleet Owner mode', async () => {
        const { user } = renderWithProviders(<Register />)
        
        const ownerBtn = screen.getByText('Fleet Owner', { selector: 'p' })
        await user.click(ownerBtn)

        const nameInput = screen.getByPlaceholderText('e.g. Gurpreet Singh')
        const companyInput = screen.getByPlaceholderText('e.g. Shergill Logistics')
        const truckInput = screen.getByPlaceholderText('e.g. PB10 AB 4521')

        await user.type(nameInput, 'Harman Singh')
        await user.type(companyInput, 'Harman Fleet Group')
        await user.type(truckInput, 'PB12 AB 8888')

        const btn = screen.getByRole('button', { name: 'Create Account' })
        expect(btn).not.toBeDisabled()
    })
})
