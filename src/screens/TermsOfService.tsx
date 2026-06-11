import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import TopBar from '../components/TopBar'

export default function TermsOfService() {
    const nav = useNavigate()
    const { t } = useTranslation()

    return (
        <div className="h-full flex flex-col">
            <TopBar title={t('legal.terms_of_service', 'Terms of Service')} back onBack={() => nav('/profile')} />
            <div className="flex-1 app-scroll no-scrollbar px-5 py-4 pb-tabs space-y-6 text-left">
                {/* Last Updated */}
                <p className="text-xs text-ink-faint font-bold">Last updated: June 10, 2026</p>

                <Section heading={t('legal.introduction', 'Introduction')}>
                    <p>
                        Welcome to HindTrucks. These Terms of Service (&ldquo;Terms&rdquo;) govern your access to and use of
                        the HindTrucks mobile application (the &ldquo;App&rdquo;), operated by HindTrucks Technologies Pvt Ltd
                        (&ldquo;we,&rdquo; &ldquo;our,&rdquo; or &ldquo;us&rdquo;). By downloading, installing, or using the
                        App, you agree to be bound by these Terms. If you do not agree, please do not use the App.
                    </p>
                </Section>

                <Section heading={t('legal.service_description', 'Service Description')}>
                    <p>
                        HindTrucks is a digital logistics platform that connects truck drivers and fleet owners with
                        shippers for freight transportation. The App provides:
                    </p>
                    <ul className="list-disc pl-5 space-y-1 text-sm mt-2">
                        <li>Load discovery and matching based on truck type, capacity, and location.</li>
                        <li>Trip management including real-time GPS tracking and status updates.</li>
                        <li>Earnings tracking, wallet management, and payout processing.</li>
                        <li>Driver profile management with document verification.</li>
                        <li>Fleet management for owners with multiple trucks.</li>
                    </ul>
                    <p className="mt-2">
                        We act solely as a technology platform connecting drivers and shippers. We do not provide
                        transportation services directly, nor do we employ drivers. All transportation contracts are
                        between the driver and the shipper.
                    </p>
                </Section>

                <Section heading={t('legal.eligibility', 'Eligibility')}>
                    <ul className="list-disc pl-5 space-y-1 text-sm">
                        <li>You must be at least 18 years of age to use the App.</li>
                        <li>You must hold a valid driving license for the vehicle category you operate.</li>
                        <li>Your vehicle must have valid registration (RC), insurance, and permits as required by Indian law.</li>
                        <li>You must provide accurate and complete information during registration.</li>
                    </ul>
                </Section>

                <Section heading={t('legal.user_responsibilities', 'User Responsibilities')}>
                    <p>As a user of HindTrucks, you agree to:</p>
                    <ul className="list-disc pl-5 space-y-1.5 text-sm mt-2">
                        <li>Maintain the accuracy of your profile information, including phone number, truck details, and documents.</li>
                        <li>Keep your account credentials secure and not share them with others.</li>
                        <li>Comply with all applicable laws, including traffic regulations, motor vehicle laws, and goods carriage regulations.</li>
                        <li>Complete accepted loads in a timely and professional manner.</li>
                        <li>Not use the App for any illegal, fraudulent, or unauthorized purpose.</li>
                        <li>Not interfere with or disrupt the App&rsquo;s operation or its servers.</li>
                        <li>Report any issues, accidents, or disputes promptly through the App or support channels.</li>
                    </ul>
                </Section>

                <Section heading={t('legal.account_termination', 'Account Termination')}>
                    <p>
                        We reserve the right to suspend or terminate your account at any time, with or without notice, for:
                    </p>
                    <ul className="list-disc pl-5 space-y-1 text-sm mt-2">
                        <li>Violation of these Terms or any applicable law.</li>
                        <li>Fraudulent activity, including false documentation or identity misrepresentation.</li>
                        <li>Repeated failure to complete accepted loads without valid reason.</li>
                        <li>Harassment or misconduct toward shippers, other drivers, or HindTrucks staff.</li>
                        <li>Extended account inactivity (at our discretion, typically 12+ months).</li>
                    </ul>
                    <p className="mt-2">
                        You may also terminate your account at any time by contacting support. Upon termination,
                        your right to use the App ceases immediately. Provisions of these Terms that by their nature
                        should survive termination (including liability limitations and dispute resolution) shall survive.
                    </p>
                </Section>

                <Section heading={t('legal.payments', 'Payments & Earnings')}>
                    <ul className="list-disc pl-5 space-y-1 text-sm">
                        <li>Earnings from completed trips are credited to your HindTrucks wallet.</li>
                        <li>Payouts are processed to your registered UPI ID or bank account upon withdrawal request.</li>
                        <li>We may deduct applicable service fees, as communicated at the time of load acceptance.</li>
                        <li>We are not responsible for delays in payment caused by shippers, banking systems, or force majeure events.</li>
                        <li>Any disputes regarding payment must be raised within 7 days of trip completion.</li>
                    </ul>
                </Section>

                <Section heading={t('legal.liability_limitations', 'Limitation of Liability')}>
                    <p>
                        To the fullest extent permitted by applicable law:
                    </p>
                    <ul className="list-disc pl-5 space-y-1.5 text-sm mt-2">
                        <li>HindTrucks is provided on an &ldquo;as is&rdquo; and &ldquo;as available&rdquo; basis without warranties of any kind, express or implied.</li>
                        <li>We do not guarantee the availability, accuracy, or reliability of load listings, GPS tracking, or earnings calculations.</li>
                        <li>We shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including loss of profits, data, or business opportunity.</li>
                        <li>Our total liability for any claim arising out of or relating to these Terms or the App shall not exceed the total service fees earned by HindTrucks from your account in the 3 months preceding the claim.</li>
                        <li>We are not liable for damages arising from force majeure events, including natural disasters, strikes, civil unrest, or government actions.</li>
                    </ul>
                </Section>

                <Section heading={t('legal.indemnification', 'Indemnification')}>
                    <p>
                        You agree to indemnify, defend, and hold harmless HindTrucks Technologies Pvt Ltd, its officers,
                        directors, employees, and agents from and against any claims, liabilities, damages, losses, and
                        expenses (including reasonable legal fees) arising out of or in connection with:
                    </p>
                    <ul className="list-disc pl-5 space-y-1 text-sm mt-2">
                        <li>Your violation of these Terms.</li>
                        <li>Your violation of any third-party rights, including intellectual property or privacy rights.</li>
                        <li>Your violation of any applicable law or regulation.</li>
                        <li>Any accidents, damages, or injuries arising from your use of the App or transportation services.</li>
                    </ul>
                </Section>

                <Section heading={t('legal.modifications', 'Modifications to Terms')}>
                    <p>
                        We reserve the right to modify these Terms at any time. When we make material changes, we will
                        notify you through the App or via the phone number registered to your account at least 30 days
                        before the changes take effect. Your continued use of the App after the effective date constitutes
                        acceptance of the revised Terms. If you do not agree to the changes, you must stop using the App
                        and may terminate your account.
                    </p>
                </Section>

                <Section heading={t('legal.dispute_resolution', 'Dispute Resolution')}>
                    <p>
                        These Terms are governed by the laws of the Republic of India. Any dispute arising out of or
                        relating to these Terms or the App shall be resolved as follows:
                    </p>
                    <ol className="list-decimal pl-5 space-y-1.5 text-sm mt-2">
                        <li>
                            <strong>Informal Resolution:</strong> You agree to first contact us at legal@hindtrucks.in
                            to attempt to resolve the dispute informally within 30 days.
                        </li>
                        <li>
                            <strong>Arbitration:</strong> If informal resolution fails, the dispute shall be referred to
                            binding arbitration under the Arbitration and Conciliation Act, 1996. The arbitration shall be
                            conducted in Chandigarh, India, in English, by a sole arbitrator mutually agreed upon by both
                            parties.
                        </li>
                        <li>
                            <strong>Jurisdiction:</strong> Subject to the arbitration clause, the courts in Chandigarh,
                            India shall have exclusive jurisdiction over any matters relating to these Terms.
                        </li>
                    </ol>
                </Section>

                <Section heading={t('legal.contact_info', 'Contact Us')}>
                    <p>
                        For questions about these Terms of Service, please contact us at:
                    </p>
                    <div className="mt-3 p-4 bg-surface-grey border border-hairline rounded-xl space-y-1.5">
                        <p className="text-sm font-bold"><strong>Email:</strong> legal@hindtrucks.in</p>
                        <p className="text-sm font-bold"><strong>Phone:</strong> +91 98765 43210</p>
                        <p className="text-sm font-bold"><strong>Address:</strong> HindTrucks Technologies Pvt Ltd,<br />Plot No. 42, Industrial Area Phase 1,<br />Chandigarh, 160002, India</p>
                    </div>
                </Section>

                <div className="h-8" />
            </div>
        </div>
    )
}

function Section({ heading, children }: { heading: string; children: React.ReactNode }) {
    return (
        <div>
            <h2 className="text-base font-extrabold text-ink mb-2 pb-2 border-b border-hairline">{heading}</h2>
            <div className="text-sm text-ink-muted leading-relaxed space-y-1.5 font-medium">
                {children}
            </div>
        </div>
    )
}