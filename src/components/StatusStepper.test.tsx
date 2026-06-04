import { render, screen } from '@testing-library/react'
import StatusStepper from './StatusStepper'

describe('StatusStepper', () => {
    const steps = ['Picked Up', 'In Transit', 'Delivered']

    it('renders all steps', () => {
        render(<StatusStepper steps={steps} current={0} />)
        steps.forEach((step) => {
            expect(screen.getByText(step)).toBeInTheDocument()
        })
    })

    it('shows step numbers when not done', () => {
        render(<StatusStepper steps={steps} current={0} />)
        expect(screen.getByText('1')).toBeInTheDocument()
        expect(screen.getByText('2')).toBeInTheDocument()
        expect(screen.getByText('3')).toBeInTheDocument()
    })

    it('shows check icons for completed steps', () => {
        render(<StatusStepper steps={steps} current={2} />)
        // Steps 0 and 1 are done, so they should show check icons
        const checks = document.querySelectorAll('.lucide-check')
        expect(checks.length).toBe(2)
    })
})