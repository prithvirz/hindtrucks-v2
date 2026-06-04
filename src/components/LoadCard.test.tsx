import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '../__tests__/test-utils'
import LoadCard from './LoadCard'
import type { Load } from '../data/mockLoads'

const mockLoad: Load = {
    id: 'L1042',
    fromCity: 'Delhi',
    fromArea: 'Okhla Industrial Area',
    toCity: 'Jaipur',
    toArea: 'Sitapura',
    goods: 'electronics',
    weightTon: 9,
    distanceKm: 281,
    price: 18500,
    advance: 6000,
    truckType: '19 ft · 9 Ton',
    shipperName: 'Sharma Electronics',
    shipperVerified: true,
    image: 'https://example.com/electronics.jpg',
}

describe('LoadCard', () => {
    it('renders route from → to', () => {
        renderWithProviders(<LoadCard load={mockLoad} />)
        expect(screen.getByText('Delhi')).toBeInTheDocument()
        expect(screen.getByText('Jaipur')).toBeInTheDocument()
    })

    it('renders goods type and weight', () => {
        renderWithProviders(<LoadCard load={mockLoad} />)
        expect(screen.getByText('goods.electronics')).toBeInTheDocument()
        expect(screen.getByText('9 common.ton')).toBeInTheDocument()
    })

    it('renders price formatted in INR', () => {
        renderWithProviders(<LoadCard load={mockLoad} />)
        expect(screen.getByText('₹18,500')).toBeInTheDocument()
    })

    it('renders distance', () => {
        renderWithProviders(<LoadCard load={mockLoad} />)
        expect(screen.getByText('281 common.km')).toBeInTheDocument()
    })

    it('shows verified badge for verified shipper', () => {
        renderWithProviders(<LoadCard load={mockLoad} />)
        expect(screen.getByText('common.verified')).toBeInTheDocument()
    })

    it('does not show verified badge when shipper not verified', () => {
        const unverified = { ...mockLoad, shipperVerified: false }
        renderWithProviders(<LoadCard load={unverified} />)
        expect(screen.queryByText('common.verified')).not.toBeInTheDocument()
    })

    it('calls onClick when clicked', async () => {
        const onClick = vi.fn()
        renderWithProviders(<LoadCard load={mockLoad} onClick={onClick} />)
        await userEvent.click(screen.getByRole('button'))
        expect(onClick).toHaveBeenCalledTimes(1)
    })

    it('renders load image with lazy loading', () => {
        renderWithProviders(<LoadCard load={mockLoad} />)
        const img = document.querySelector('img')
        expect(img).not.toBeNull()
        expect(img).toHaveAttribute('src', mockLoad.image)
        expect(img).toHaveAttribute('loading', 'lazy')
    })
})