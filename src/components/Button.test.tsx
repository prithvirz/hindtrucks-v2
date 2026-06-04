import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Button from './Button'

describe('Button', () => {
    it('renders children text', () => {
        render(<Button>Accept Load</Button>)
        expect(screen.getByRole('button', { name: 'Accept Load' })).toBeInTheDocument()
    })

    it('calls onClick when clicked', async () => {
        const onClick = vi.fn()
        render(<Button onClick={onClick}>Click Me</Button>)
        await userEvent.click(screen.getByRole('button'))
        expect(onClick).toHaveBeenCalledTimes(1)
    })

    it('does not call onClick when disabled', async () => {
        const onClick = vi.fn()
        render(<Button disabled onClick={onClick}>Disabled</Button>)
        const btn = screen.getByRole('button')
        expect(btn).toBeDisabled()
        await userEvent.click(btn)
        expect(onClick).not.toHaveBeenCalled()
    })

    it('applies variant classes', () => {
        const { rerender } = render(<Button variant="primary">Primary</Button>)
        let btn = screen.getByRole('button')
        expect(btn.className).toContain('bg-accent')

        rerender(<Button variant="secondary">Secondary</Button>)
        btn = screen.getByRole('button')
        expect(btn.className).toContain('bg-accent-soft')

        rerender(<Button variant="ghost">Ghost</Button>)
        btn = screen.getByRole('button')
        expect(btn.className).toContain('bg-surface')

        rerender(<Button variant="dark">Dark</Button>)
        btn = screen.getByRole('button')
        expect(btn.className).toContain('bg-night-900')
    })

    it('applies size classes', () => {
        const { rerender } = render(<Button size="sm">Small</Button>)
        expect(screen.getByRole('button').className).toContain('h-10')

        rerender(<Button size="md">Medium</Button>)
        expect(screen.getByRole('button').className).toContain('h-12')

        rerender(<Button size="lg">Large</Button>)
        expect(screen.getByRole('button').className).toContain('h-14')
    })

    it('applies full width class when full=true', () => {
        render(<Button full>Full Width</Button>)
        expect(screen.getByRole('button').className).toContain('w-full')
    })

    it('renders leftIcon and rightIcon', () => {
        render(
            <Button leftIcon={<span data-testid="left">L</span>} rightIcon={<span data-testid="right">R</span>}>
                Icons
            </Button>,
        )
        expect(screen.getByTestId('left')).toBeInTheDocument()
        expect(screen.getByTestId('right')).toBeInTheDocument()
    })

    it('merges custom className', () => {
        render(<Button className="custom-class">Styled</Button>)
        expect(screen.getByRole('button').className).toContain('custom-class')
    })
})