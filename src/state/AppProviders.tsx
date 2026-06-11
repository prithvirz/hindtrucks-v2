import { type ReactNode } from 'react'
import { AuthProvider } from './AuthContext'
import { ShellProvider } from './ShellContext'
import { NotificationProvider } from './NotificationContext'
import { ProfileProvider } from './ProfileContext'
import { TripProvider } from './TripContext'
import { EarningsProvider } from './EarningsContext'
import { ChatProvider } from './ChatContext'
import { ThemeProvider } from './ThemeContext'

export function AppProviders({ children }: { children: ReactNode }) {
    return (
        <ThemeProvider>
            <AuthProvider>
                <ShellProvider>
                    <NotificationProvider>
                        <ProfileProvider>
                            <TripProvider>
                                <EarningsProvider>
                                    <ChatProvider>
                                        {children}
                                    </ChatProvider>
                                </EarningsProvider>
                            </TripProvider>
                        </ProfileProvider>
                    </NotificationProvider>
                </ShellProvider>
            </AuthProvider>
        </ThemeProvider>
    )
}