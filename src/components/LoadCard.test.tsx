import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { render } from '@testing-library/react'
import LoadCard from './LoadCard'
import type { Load } from '../data/mockLoads'

vi.mock('../state/ProfileContext', () => ({
    useProfile: () => ({
        driver: {
            trucks: [
                { id: '1', regNumber: 'PB10 AB 4521', type: '19 ft Container', capacity: '9 Ton', isActive: true },
            ],
        },
    }),
}))

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
        render(<LoadCard load={mockLoad} />)
        expect(screen.getByText('Delhi')).toBeInTheDocument()
        expect(screen.getByText('Jaipur')).toBeInTheDocument()
    })

    it('renders goods type and weight', () => {
        render(<LoadCard load={mockLoad} />)
        expect(screen.getByText('goods.electronics')).toBeInTheDocument()
        expect(screen.getByText('9 common.ton')).toBeInTheDocument()
    })

    it('renders price formatted in INR', () => {
        render(<LoadCard load={mockLoad} />)
        expect(screen.getByText('₹18,500')).toBeInTheDocument()
    })

    it('renders distance', () => {
        render(<LoadCard load={mockLoad} />)
        expect(screen.getByText('281 common.km')).toBeInTheDocument()
    })

    it('shows verified badge for verified shipper', () => {
        render(<LoadCard load={mockLoad} />)
        expect(screen.getByText('common.verified')).toBeInTheDocument()
    })

    it('does not show verified badge when shipper not verified', () => {
        const unverified = { ...mockLoad, shipperVerified: false }
        render(<LoadCard load={unverified} />)
        expect(screen.queryByText('common.verified')).not.toBeInTheDocument()
    })

    it('calls onClick when clicked', async () => {
        const onClick = vi.fn()
        render(<LoadCard load={mockLoad} onClick={onClick} />)
        await userEvent.click(screen.getByRole('button'))
        expect(onClick).toHaveBeenCalledTimes(1)
    })

    it('renders load image with lazy loading', () => {
        render(<LoadCard load={mockLoad} />)
        const img = document.querySelector('img')
        expect(img).not.toBeNull()
        expect(img).toHaveAttribute('src', mockLoad.image)
        expect(img).toHaveAttribute('loading', 'lazy')
    })
})
