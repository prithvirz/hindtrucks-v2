import { screen } from '@testing-library/react'
import { renderWithProviders } from '../__tests__/test-utils'
import PrivacyPolicy from './PrivacyPolicy'

describe('PrivacyPolicy Screen', () => {
    it('renders the privacy policy title', () => {
        renderWithProviders(<PrivacyPolicy />)
        expect(screen.getByText('legal.privacy_policy')).toBeInTheDocument()
    })

    it('renders the last updated date', () => {
        renderWithProviders(<PrivacyPolicy />)
        expect(screen.getByText(/Last updated:/)).toBeInTheDocument()
    })

    it('renders data collection section', () => {
        renderWithProviders(<PrivacyPolicy />)
        expect(screen.getByText('legal.data_collection')).toBeInTheDocument()
    })

    it('renders data usage section', () => {
        renderWithProviders(<PrivacyPolicy />)
        expect(screen.getByText('legal.data_usage')).toBeInTheDocument()
    })

    it('renders data sharing section', () => {
        renderWithProviders(<PrivacyPolicy />)
        expect(screen.getByText('legal.data_sharing')).toBeInTheDocument()
    })

    it('renders your rights section', () => {
        renderWithProviders(<PrivacyPolicy />)
        expect(screen.getByText('legal.your_rights')).toBeInTheDocument()
    })

    it('renders contact info section', () => {
        renderWithProviders(<PrivacyPolicy />)
        expect(screen.getByText('legal.contact_info')).toBeInTheDocument()
    })

    it('renders the grievance officer contact', () => {
        renderWithProviders(<PrivacyPolicy />)
        expect(screen.getByText(/privacy@hindtrucks\.in/)).toBeInTheDocument()
    })

    it('renders back button', () => {
        renderWithProviders(<PrivacyPolicy />)
        const backBtn = screen.getByLabelText('Back')
        expect(backBtn).toBeInTheDocument()
    })
})