import { screen } from '@testing-library/react'
import { renderWithProviders } from '../__tests__/test-utils'
import TermsOfService from './TermsOfService'

describe('TermsOfService Screen', () => {
    it('renders the terms of service title', () => {
        renderWithProviders(<TermsOfService />)
        expect(screen.getByText('legal.terms_of_service')).toBeInTheDocument()
    })

    it('renders the last updated date', () => {
        renderWithProviders(<TermsOfService />)
        expect(screen.getByText(/Last updated:/)).toBeInTheDocument()
    })

    it('renders service description section', () => {
        renderWithProviders(<TermsOfService />)
        expect(screen.getByText('legal.service_description')).toBeInTheDocument()
    })

    it('renders user responsibilities section', () => {
        renderWithProviders(<TermsOfService />)
        expect(screen.getByText('legal.user_responsibilities')).toBeInTheDocument()
    })

    it('renders account termination section', () => {
        renderWithProviders(<TermsOfService />)
        expect(screen.getByText('legal.account_termination')).toBeInTheDocument()
    })

    it('renders liability limitations section', () => {
        renderWithProviders(<TermsOfService />)
        expect(screen.getByText('legal.liability_limitations')).toBeInTheDocument()
    })

    it('renders dispute resolution section', () => {
        renderWithProviders(<TermsOfService />)
        expect(screen.getByText('legal.dispute_resolution')).toBeInTheDocument()
    })

    it('renders contact info section', () => {
        renderWithProviders(<TermsOfService />)
        expect(screen.getByText('legal.contact_info')).toBeInTheDocument()
    })

    it('renders the legal contact email', () => {
        renderWithProviders(<TermsOfService />)
        const elements = screen.getAllByText(/legal@hindtrucks\.in/)
        expect(elements.length).toBeGreaterThanOrEqual(1)
    })

    it('renders back button', () => {
        renderWithProviders(<TermsOfService />)
        const backBtn = screen.getByLabelText('Back')
        expect(backBtn).toBeInTheDocument()
    })
})