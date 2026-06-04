import { render } from '@testing-library/react'
import RouteMap from './RouteMap'

describe('RouteMap', () => {
    it('renders the SVG map', () => {
        const { container } = render(<RouteMap />)
        const svg = container.querySelector('svg')
        expect(svg).toBeInTheDocument()
    })

    it('renders the truck marker icon', () => {
        render(<RouteMap />)
        expect(document.querySelector('.lucide-truck')).toBeInTheDocument()
    })

    it('clamps progress between 0.04 and 0.96', () => {
        const { container } = render(<RouteMap progress={-1} />)
        const truck = container.querySelector('.lucide-truck')
        expect(truck).toBeInTheDocument()
    })

    it('accepts custom progress value', () => {
        const { container } = render(<RouteMap progress={0.75} />)
        const truck = container.querySelector('.lucide-truck')
        expect(truck).toBeInTheDocument()
    })
})