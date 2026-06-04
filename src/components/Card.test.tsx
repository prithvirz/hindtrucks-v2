import { render, screen } from '@testing-library/react'
import Card from './Card'

describe('Card', () => {
    it('renders children', () => {
        render(<Card>Hello World</Card>)
        expect(screen.getByText('Hello World')).toBeInTheDocument()
    })

    it('applies padding by default', () => {
        render(<Card>Padded</Card>)
        const div = screen.getByText('Padded')
        expect(div.className).toContain('p-4')
    })

    it('removes padding when padded=false', () => {
        render(<Card padded={false}>No Padding</Card>)
        const div = screen.getByText('No Padding')
        expect(div.className).not.toContain('p-4')
    })

    it('merges custom className', () => {
        render(<Card className="custom">Styled</Card>)
        const div = screen.getByText('Styled')
        expect(div.className).toContain('custom')
    })

    it('passes additional HTML attributes', () => {
        render(<Card data-testid="my-card" id="card-1">With Attrs</Card>)
        const div = screen.getByTestId('my-card')
        expect(div.id).toBe('card-1')
    })
})