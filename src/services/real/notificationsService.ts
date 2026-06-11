import { request } from '../apiClient'
import type { INotificationsService, NotificationPage } from '../types'

export function createRealNotificationsService(): INotificationsService {
    return {
        async registerToken(token: string) {
            await request({ method: 'POST', path: '/notifications/register-token', body: { token } })
        },
        async unregisterToken(token: string) {
            await request({ method: 'POST', path: '/notifications/unregister-token', body: { token } })
        },
        async subscribeToTopic(topic: string) {
            await request({ method: 'POST', path: '/notifications/subscribe-topic', body: { topic } })
        },
        async unsubscribeFromTopic(topic: string) {
            await request({ method: 'POST', path: '/notifications/unsubscribe-topic', body: { topic } })
        },
        async getHistory(page = 1, limit = 20): Promise<NotificationPage> {
            const response = await request<NotificationPage>({
                method: 'GET',
                path: '/notifications/history',
                query: { page: String(page), limit: String(limit) },
            })
            return response.data
        },
        async markRead(notificationId: string) {
            await request({ method: 'PATCH', path: `/notifications/${notificationId}/read` })
        },
        async markAllRead() {
            await request({ method: 'PATCH', path: '/notifications/read-all' })
        },
    }
}