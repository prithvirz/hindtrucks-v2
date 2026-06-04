import { screen } from '@testing-library/react'
import { renderWithProviders } from '../__tests__/test-utils'
import Earnings from './Earnings'

describe('Earnings Screen', () => {
    it('renders wallet balance label', () => {
        renderWithProviders(<Earnings />)
        expect(screen.getByText('earnings.balance')).toBeInTheDocument()
    })

    it('renders withdraw button', () => {
        renderWithProviders(<Earnings />)
        expect(screen.getByRole('button', { name: 'earnings.withdraw' })).toBeInTheDocument()
    })

    it('renders weekly earnings section', () => {
        renderWithProviders(<Earnings />)
        expect(screen.getByText('earnings.thisWeek')).toBeInTheDocument()
    })

    it('renders payout history section', () => {
        renderWithProviders(<Earnings />)
        expect(screen.getByText('earnings.history')).toBeInTheDocument()
    })
})