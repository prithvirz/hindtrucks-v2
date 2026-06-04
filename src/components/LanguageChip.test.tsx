import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import LanguageChip from './LanguageChip'
import type { Language } from '../i18n/languages'

const mockLang: Language = {
    code: 'hi',
    nativeName: 'हिन्दी',
    englishName: 'Hindi',
    regions: [],
}

describe('LanguageChip', () => {
    it('renders native and english names', () => {
        render(<LanguageChip lang={mockLang} selected={false} onClick={vi.fn()} />)
        expect(screen.getByText('हिन्दी')).toBeInTheDocument()
        expect(screen.getByText('Hindi')).toBeInTheDocument()
    })

    it('calls onClick when clicked', async () => {
        const onClick = vi.fn()
        render(<LanguageChip lang={mockLang} selected={false} onClick={onClick} />)
        await userEvent.click(screen.getByRole('button'))
        expect(onClick).toHaveBeenCalledTimes(1)
    })

    it('shows check icon when selected', () => {
        render(<LanguageChip lang={mockLang} selected={true} onClick={vi.fn()} />)
        expect(document.querySelector('.lucide-check')).toBeInTheDocument()
    })

    it('shows suggested label when suggested', () => {
        render(
            <LanguageChip
                lang={mockLang}
                selected={false}
                suggested
                suggestedLabel="Suggested"
                onClick={vi.fn()}
            />,
        )
        expect(screen.getByText('Suggested')).toBeInTheDocument()
    })
})