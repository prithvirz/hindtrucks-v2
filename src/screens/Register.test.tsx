import { screen, fireEvent, act } from '@testing-library/react'
import { renderWithProviders } from '../__tests__/test-utils'
import Register from './Register'

describe('Register Screen', () => {
    afterEach(() => {
        vi.useRealTimers()
    })

    it('renders register screen header and elements', () => {
        renderWithProviders(<Register />)
        expect(screen.getByRole('heading', { name: 'Complete Verification' })).toBeInTheDocument()
        expect(screen.getByText('Welcome to HindTrucks!')).toBeInTheDocument()
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

    it('enables and navigates 3-step registration in Driver mode', async () => {
        vi.useFakeTimers()
        renderWithProviders(<Register />)

        // Step 1: Personal Details
        const nameInput = screen.getByPlaceholderText('e.g. Rajesh Kumar')
        const licenseInput = screen.getByPlaceholderText('e.g. DL-14201234567')

        fireEvent.change(nameInput, { target: { value: 'Jaspreet Singh' } })
        fireEvent.change(licenseInput, { target: { value: 'DL-14202345678' } })

        const nextBtn1 = screen.getByRole('button', { name: 'Next: Truck Details' })
        expect(nextBtn1).not.toBeDisabled()
        
        // Proceed to Step 2
        fireEvent.click(nextBtn1)

        // Step 2: Truck Details
        const truckInput = screen.getByPlaceholderText('e.g. PB10 AB 4521')
        fireEvent.change(truckInput, { target: { value: 'PB12 AB 9999' } })

        const nextBtn2 = screen.getByRole('button', { name: 'Next: Documents' })
        expect(nextBtn2).not.toBeDisabled()

        // Proceed to Step 3
        fireEvent.click(nextBtn2)

        // Step 3: Documents
        // Click each document to scan
        const doc1Btn = screen.getByRole('button', { name: /Driving License/i })
        const doc2Btn = screen.getByRole('button', { name: /RC Book Copy/i })
        const doc3Btn = screen.getByRole('button', { name: /National Permit/i })

        fireEvent.click(doc1Btn)
        fireEvent.click(doc2Btn)
        fireEvent.click(doc3Btn)

        // Wait for OCR verification delay (1200ms)
        act(() => {
            vi.advanceTimersByTime(1200)
        })

        // Now "Verify & Claim ₹1,500" should be enabled
        const submitBtn = screen.getByRole('button', { name: 'Verify & Claim ₹1,500' })
        expect(submitBtn).not.toBeDisabled()
    })

    it('enables and navigates 3-step registration in Fleet Owner mode', () => {
        vi.useFakeTimers()
        renderWithProviders(<Register />)

        // Select Fleet Owner
        const ownerCard = screen.getByText('Fleet Owner', { selector: 'p' })
        fireEvent.click(ownerCard)

        // Step 1: Personal Details
        const nameInput = screen.getByPlaceholderText('e.g. Rajesh Kumar')
        const companyInput = screen.getByPlaceholderText('e.g. Shergill Logistics')

        fireEvent.change(nameInput, { target: { value: 'Harman Singh' } })
        fireEvent.change(companyInput, { target: { value: 'Harman Fleet Group' } })

        const nextBtn1 = screen.getByRole('button', { name: 'Next: Truck Details' })
        expect(nextBtn1).not.toBeDisabled()
        
        // Proceed to Step 2
        fireEvent.click(nextBtn1)

        // Step 2: Truck Details
        const truckInput = screen.getByPlaceholderText('e.g. PB10 AB 4521')
        fireEvent.change(truckInput, { target: { value: 'PB12 AB 8888' } })

        const nextBtn2 = screen.getByRole('button', { name: 'Next: Documents' })
        expect(nextBtn2).not.toBeDisabled()

        // Proceed to Step 3
        fireEvent.click(nextBtn2)

        // Step 3: Documents
        // Click each document to scan
        const doc1Btn = screen.getByRole('button', { name: /Fleet Business PAN Card/i })
        const doc2Btn = screen.getByRole('button', { name: /RC Book Copy/i })
        const doc3Btn = screen.getByRole('button', { name: /National Permit/i })

        fireEvent.click(doc1Btn)
        fireEvent.click(doc2Btn)
        fireEvent.click(doc3Btn)

        // Wait for OCR verification delay (1200ms)
        act(() => {
            vi.advanceTimersByTime(1200)
        })

        // Now "Verify & Claim ₹1,500" should be enabled
        const submitBtn = screen.getByRole('button', { name: 'Verify & Claim ₹1,500' })
        expect(submitBtn).not.toBeDisabled()
    })
})
