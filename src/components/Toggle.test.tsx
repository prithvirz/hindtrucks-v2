import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Toggle from './Toggle'

describe('Toggle', () => {
    it('renders as switch with role=switch', () => {
        render(<Toggle on={false} onChange={vi.fn()} />)
        expect(screen.getByRole('switch')).toBeInTheDocument()
    })

    it('has aria-checked=true when on', () => {
        render(<Toggle on={true} onChange={vi.fn()} />)
        expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'true')
    })

    it('has aria-checked=false when off', () => {
        render(<Toggle on={false} onChange={vi.fn()} />)
        expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'false')
    })

    it('calls onChange with toggled value when clicked', async () => {
        const onChange = vi.fn()
        render(<Toggle on={false} onChange={onChange} />)
        await userEvent.click(screen.getByRole('switch'))
        expect(onChange).toHaveBeenCalledWith(true)
    })

    it('calls onChange with false when currently on', async () => {
        const onChange = vi.fn()
        render(<Toggle on={true} onChange={onChange} />)
        await userEvent.click(screen.getByRole('switch'))
        expect(onChange).toHaveBeenCalledWith(false)
    })
})