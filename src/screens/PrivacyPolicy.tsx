import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import TopBar from '../components/TopBar'

export default function PrivacyPolicy() {
    const nav = useNavigate()
    const { t } = useTranslation()

    return (
        <div className="h-full flex flex-col">
            <TopBar title={t('legal.privacy_policy', 'Privacy Policy')} back onBack={() => nav('/profile')} />
            <div className="flex-1 app-scroll no-scrollbar px-5 py-4 pb-tabs space-y-6 text-left">
                {/* Last Updated */}
                <p className="text-xs text-ink-faint font-bold">Last updated: June 10, 2026</p>

                <Section heading={t('legal.introduction', 'Introduction')}>
                    <p>
                        HindTrucks (&ldquo;we,&rdquo; &ldquo;our,&rdquo; or &ldquo;us&rdquo;) is committed to protecting your privacy.
                        This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our
                        mobile application (the &ldquo;App&rdquo;). Please read this policy carefully. By using the App, you agree to
                        the collection and use of information in accordance with this policy.
                    </p>
                </Section>

                <Section heading={t('legal.data_collection', 'Information We Collect')}>
                    <h3 className="text-sm font-extrabold text-ink mt-3 mb-1.5">Personal Information</h3>
                    <ul className="list-disc pl-5 space-y-1 text-sm">
                        <li><strong>Phone Number:</strong> Collected during registration for account verification via OTP.</li>
                        <li><strong>Full Name:</strong> Provided during profile setup to identify your account.</li>
                        <li><strong>Driving License Number:</strong> Collected for driver verification and compliance.</li>
                        <li><strong>Truck Registration Number:</strong> Collected for vehicle identification and load matching.</li>
                        <li><strong>Vehicle Type & Capacity:</strong> Used to match appropriate loads to your truck.</li>
                    </ul>

                    <h3 className="text-sm font-extrabold text-ink mt-4 mb-1.5">Location Information</h3>
                    <ul className="list-disc pl-5 space-y-1 text-sm">
                        <li><strong>GPS Location:</strong> Collected with your permission to track trip progress, provide accurate ETAs, and match nearby loads.</li>
                        <li><strong>Background Location:</strong> May be collected during active trips even when the app is in the background, to provide end-to-end trip tracking.</li>
                    </ul>

                    <h3 className="text-sm font-extrabold text-ink mt-4 mb-1.5">Device & Usage Information</h3>
                    <ul className="list-disc pl-5 space-y-1 text-sm">
                        <li><strong>Device Information:</strong> Device model, operating system version, and app version for troubleshooting and compatibility.</li>
                        <li><strong>Push Notification Token:</strong> Firebase Cloud Messaging token for sending load alerts and trip updates.</li>
                        <li><strong>Usage Data:</strong> App interaction data to improve user experience and service quality.</li>
                    </ul>
                </Section>

                <Section heading={t('legal.data_usage', 'How We Use Your Information')}>
                    <ul className="list-disc pl-5 space-y-1.5 text-sm">
                        <li><strong>Load Matching:</strong> Your truck type, capacity, and location are used to match you with relevant loads.</li>
                        <li><strong>Trip Tracking:</strong> GPS data is used to provide real-time trip progress to shippers and calculate ETAs.</li>
                        <li><strong>Earnings Calculation:</strong> Trip and payment data are used to calculate your earnings and process payouts.</li>
                        <li><strong>Account Management:</strong> Your profile information is used to manage your account, verify your identity, and provide support.</li>
                        <li><strong>Notifications:</strong> Push notifications are sent for load alerts, trip status updates, and payment confirmations.</li>
                        <li><strong>Service Improvement:</strong> Aggregated and anonymized data helps us improve the App and develop new features.</li>
                    </ul>
                </Section>

                <Section heading={t('legal.data_sharing', 'Third-Party Sharing')}>
                    <p>
                        We do not sell your personal information. We may share your data with third parties only in the
                        following circumstances:
                    </p>
                    <ul className="list-disc pl-5 space-y-1.5 text-sm mt-2">
                        <li><strong>Firebase (Google):</strong> Used for authentication, Firestore database, cloud messaging, and analytics. Data is processed per Google&rsquo;s privacy policy.</li>
                        <li><strong>Map Providers:</strong> Location data is processed through mapping services (e.g., Google Maps) for route display and navigation.</li>
                        <li><strong>Shippers:</strong> During active trips, your name, truck details, and real-time location are shared with the shipper for load tracking.</li>
                        <li><strong>Legal Compliance:</strong> We may disclose information if required by law, court order, or government regulation.</li>
                        <li><strong>Service Providers:</strong> Third-party vendors who assist us in operating the App, subject to confidentiality agreements.</li>
                    </ul>
                </Section>

                <Section heading={t('legal.data_retention', 'Data Retention')}>
                    <ul className="list-disc pl-5 space-y-1.5 text-sm">
                        <li>Account information is retained as long as your account remains active.</li>
                        <li>Trip history and earnings records are retained for a minimum of 7 years as required by Indian tax and commercial laws.</li>
                        <li>Location data from completed trips is retained for a reasonable period for dispute resolution and analytics.</li>
                        <li>Upon account deletion, personal data is removed within 30 days, except where retention is required by law.</li>
                    </ul>
                </Section>

                <Section heading={t('legal.your_rights', 'Your Rights')}>
                    <p>
                        Under applicable data protection laws, including the Digital Personal Data Protection Act, 2023 (India),
                        you have the following rights:
                    </p>
                    <ul className="list-disc pl-5 space-y-1.5 text-sm mt-2">
                        <li><strong>Access:</strong> You can request a copy of your personal data we hold by contacting our support team.</li>
                        <li><strong>Correction:</strong> You can update your profile information at any time through the Profile screen.</li>
                        <li><strong>Deletion:</strong> You can request deletion of your account and associated data by contacting support. Trip and earnings records required by law will be retained.</li>
                        <li><strong>Withdraw Consent:</strong> You can revoke location permissions through your device settings at any time.</li>
                        <li><strong>Grievance Redressal:</strong> You have the right to file a complaint with the Data Protection Board of India.</li>
                    </ul>
                </Section>

                <Section heading={t('legal.data_security', 'Data Security')}>
                    <p>
                        We implement industry-standard security measures including encryption in transit (TLS), secure
                        authentication via Firebase, and access controls to protect your data. However, no method of
                        electronic storage or transmission is 100% secure. We cannot guarantee absolute security.
                    </p>
                </Section>

                <Section heading={t('legal.children_privacy', 'Children&rsquo;s Privacy')}>
                    <p>
                        Our App is not intended for use by individuals under the age of 18. We do not knowingly collect
                        personal information from children. If we become aware that a child has provided us with personal
                        data, we will delete it promptly.
                    </p>
                </Section>

                <Section heading={t('legal.contact_info', 'Contact Us')}>
                    <p>
                        If you have questions or concerns about this Privacy Policy, or wish to exercise your data rights,
                        please contact our Grievance Officer:
                    </p>
                    <div className="mt-3 p-4 bg-surface-grey border border-hairline rounded-xl space-y-1.5">
                        <p className="text-sm font-bold"><strong>Grievance Officer:</strong> Data Protection Team</p>
                        <p className="text-sm font-bold"><strong>Email:</strong> privacy@hindtrucks.in</p>
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