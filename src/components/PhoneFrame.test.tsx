import { render, screen } from '@testing-library/react'
import PhoneFrame from './PhoneFrame'

describe('PhoneFrame', () => {
    it('renders children inside the phone container', () => {
        render(
            <PhoneFrame>
                <div data-testid="child">Hello</div>
            </PhoneFrame>,
        )
        expect(screen.getByTestId('child')).toBeInTheDocument()
        expect(screen.getByText('Hello')).toBeInTheDocument()
    })

    it('renders the main container with responsive classes', () => {
        render(
            <PhoneFrame>
                <div data-testid="child" />
            </PhoneFrame>,
        )
        const container = screen.getByTestId('child').parentElement
        expect(container).toHaveClass('max-w-[430px]')
    })
})