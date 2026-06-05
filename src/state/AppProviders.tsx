import { type ReactNode } from 'react'
import { AuthProvider } from './AuthContext'
import { ShellProvider } from './ShellContext'
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
                    <ProfileProvider>
                        <TripProvider>
                            <EarningsProvider>
                                <ChatProvider>
                                    {children}
                                </ChatProvider>
                            </EarningsProvider>
                        </TripProvider>
                    </ProfileProvider>
                </ShellProvider>
            </AuthProvider>
        </ThemeProvider>
    )
}