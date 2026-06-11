import type { INotificationsService, NotificationPage } from '../types'

export function createMockNotificationsService(): INotificationsService {
    const tokens: string[] = []
    const topics: string[] = []
    const mockNotifications: Array<{
        id: string
        type: string
        title: string
        body: string
        deepLink?: string
        read: boolean
        receivedAt: number
        expiresAt?: number
    }> = []

    return {
        async registerToken(token: string) {
            tokens.push(token)
        },
        async unregisterToken(token: string) {
            const idx = tokens.indexOf(token)
            if (idx !== -1) tokens.splice(idx, 1)
        },
        async subscribeToTopic(topic: string) {
            topics.push(topic)
        },
        async unsubscribeFromTopic(topic: string) {
            const idx = topics.indexOf(topic)
            if (idx !== -1) topics.splice(idx, 1)
        },
        async getHistory(page = 1, limit = 20): Promise<NotificationPage> {
            const start = (page - 1) * limit
            const items = mockNotifications.slice(start, start + limit)
            return {
                items,
                total: mockNotifications.length,
                page,
                limit,
                hasMore: start + limit < mockNotifications.length,
            }
        },
        async markRead(notificationId: string) {
            const n = mockNotifications.find(x => x.id === notificationId)
            if (n) n.read = true
        },
        async markAllRead() {
            mockNotifications.forEach(n => { n.read = true })
        },
    }
}