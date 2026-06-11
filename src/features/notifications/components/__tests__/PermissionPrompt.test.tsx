// ─── PermissionPrompt.test.tsx ───

import { render, screen, fireEvent } from '@testing-library/react'
import { PermissionPrompt } from '../PermissionPrompt'

describe('PermissionPrompt', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('renders nothing when visible is false', () => {
        const { container } = render(
            <PermissionPrompt
                visible={false}
                onEnable={vi.fn()}
                onDismiss={vi.fn()}
            />,
        )

        expect(container.firstChild).toBeNull()
    })

    it('renders modal when visible is true', () => {
        render(
            <PermissionPrompt
                visible={true}
                onEnable={vi.fn()}
                onDismiss={vi.fn()}
            />,
        )

        expect(screen.getByText('notifications.permission.title')).toBeTruthy()
        expect(screen.getByText('common.enable')).toBeTruthy()
        expect(screen.getByText('common.maybe_later')).toBeTruthy()
    })

    it('renders feature list items', () => {
        render(
            <PermissionPrompt
                visible={true}
                onEnable={vi.fn()}
                onDismiss={vi.fn()}
            />,
        )

        expect(screen.getByText('notifications.types.new_load')).toBeTruthy()
        expect(screen.getByText('notifications.types.accepted')).toBeTruthy()
        expect(screen.getByText('notifications.types.status_update')).toBeTruthy()
        expect(screen.getByText('notifications.types.earnings')).toBeTruthy()
    })

    it('calls onDismiss when Maybe Later clicked', () => {
        const onDismiss = vi.fn()

        render(
            <PermissionPrompt
                visible={true}
                onEnable={vi.fn()}
                onDismiss={onDismiss}
            />,
        )

        fireEvent.click(screen.getByText('common.maybe_later'))
        expect(onDismiss).toHaveBeenCalledTimes(1)
    })

    it('calls onDismiss when X button clicked', () => {
        const onDismiss = vi.fn()

        render(
            <PermissionPrompt
                visible={true}
                onEnable={vi.fn()}
                onDismiss={onDismiss}
            />,
        )

        const dismissBtn = screen.getByRole('button', { name: 'Dismiss' })
        fireEvent.click(dismissBtn)

        expect(onDismiss).toHaveBeenCalledTimes(1)
    })

    it('calls onEnable when Enable button clicked', async () => {
        const onEnable = vi.fn().mockResolvedValue(true)

        render(
            <PermissionPrompt
                visible={true}
                onEnable={onEnable}
                onDismiss={vi.fn()}
            />,
        )

        fireEvent.click(screen.getByText('common.enable'))

        expect(onEnable).toHaveBeenCalledTimes(1)
        // Loading spinner should appear during async call
        // After resolve, button returns to original text
        await vi.waitFor(() => {
            expect(screen.getByText('common.enable')).toBeTruthy()
        })
    })

    it('shows loading state when enabling', async () => {
        // Create a promise that we can resolve manually
        let resolvePromise!: (value: boolean) => void
        const onEnable = vi.fn().mockImplementation(() =>
            new Promise<boolean>((resolve) => {
                resolvePromise = resolve
            }),
        )

        render(
            <PermissionPrompt
                visible={true}
                onEnable={onEnable}
                onDismiss={vi.fn()}
            />,
        )

        fireEvent.click(screen.getByText('common.enable'))

        // Button text should change to spinner (not "Enable")
        expect(screen.queryByText('common.enable')).toBeNull()

        // Resolve
        resolvePromise(true)
        await vi.waitFor(() => {
            expect(screen.getByText('common.enable')).toBeTruthy()
        })
    })

    it('handles onEnable rejection gracefully', async () => {
        const onEnable = vi.fn().mockRejectedValue(new Error('Permission denied'))

        render(
            <PermissionPrompt
                visible={true}
                onEnable={onEnable}
                onDismiss={vi.fn()}
            />,
        )

        fireEvent.click(screen.getByText('common.enable'))

        await vi.waitFor(() => {
            expect(screen.getByText('common.enable')).toBeTruthy()
        })
    })
})