import { screen } from '@testing-library/react'
import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { MOCK_PAYOUTS } from '../data/mockLoads'
import Earnings from './Earnings'

const refreshEarnings = vi.fn()
const withdrawWallet = vi.fn()

vi.mock('../state/EarningsContext', () => ({
    useEarnings: () => ({
        walletBalance: 41250,
        payouts: MOCK_PAYOUTS,
        withdrawWallet,
        refreshEarnings,
    }),
}))

function renderEarnings() {
    return render(
        <MemoryRouter>
            <Earnings />
        </MemoryRouter>
    )
}

describe('Earnings Screen', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('renders wallet balance label', () => {
        renderEarnings()
        expect(screen.getByText('earnings.balance')).toBeInTheDocument()
    })

    it('renders withdraw button', () => {
        renderEarnings()
        expect(screen.getByRole('button', { name: 'earnings.withdraw' })).toBeInTheDocument()
    })

    it('renders weekly earnings section', () => {
        renderEarnings()
        expect(screen.getByText('earnings.thisWeek')).toBeInTheDocument()
    })

    it('renders payout history section', () => {
        renderEarnings()
        expect(screen.getByText('earnings.history')).toBeInTheDocument()
    })
})
