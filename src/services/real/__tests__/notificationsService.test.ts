// ─── notificationsService.test.ts (real) ───

// Hoisted mock: use inline vi.fn() in factory to avoid TDZ
vi.mock('../../apiClient', () => ({
    request: vi.fn(),
}))

import { createRealNotificationsService } from '../notificationsService'
import type { INotificationsService, NotificationPage } from '../../types'
import { request } from '../../apiClient'

// Minimal ApiResponse stub matching ApiResponse<T> shape
const okResponse = <T>(data: T) => ({ data, status: 200, headers: new Headers() })

describe('createRealNotificationsService', () => {
    let svc: INotificationsService

    beforeEach(() => {
        vi.clearAllMocks()
        svc = createRealNotificationsService()
    })

    it('registerToken sends POST /notifications/register-token', async () => {
        vi.mocked(request).mockResolvedValueOnce(okResponse(undefined))
        await svc.registerToken('abc123')
        expect(request).toHaveBeenCalledWith({
            method: 'POST',
            path: '/notifications/register-token',
            body: { token: 'abc123' },
        })
    })

    it('unregisterToken sends POST /notifications/unregister-token', async () => {
        vi.mocked(request).mockResolvedValueOnce(okResponse(undefined))
        await svc.unregisterToken('abc123')
        expect(request).toHaveBeenCalledWith({
            method: 'POST',
            path: '/notifications/unregister-token',
            body: { token: 'abc123' },
        })
    })

    it('subscribeToTopic sends POST /notifications/subscribe-topic', async () => {
        vi.mocked(request).mockResolvedValueOnce(okResponse(undefined))
        await svc.subscribeToTopic('loads')
        expect(request).toHaveBeenCalledWith({
            method: 'POST',
            path: '/notifications/subscribe-topic',
            body: { topic: 'loads' },
        })
    })

    it('unsubscribeFromTopic sends POST /notifications/unsubscribe-topic', async () => {
        vi.mocked(request).mockResolvedValueOnce(okResponse(undefined))
        await svc.unsubscribeFromTopic('loads')
        expect(request).toHaveBeenCalledWith({
            method: 'POST',
            path: '/notifications/unsubscribe-topic',
            body: { topic: 'loads' },
        })
    })

    it('getHistory sends GET and returns the page', async () => {
        const mockPage: NotificationPage = {
            items: [{ id: 'n1', type: 'new_load', title: 'T', body: 'B', read: false, receivedAt: 1 }],
            total: 1,
            page: 2,
            limit: 15,
            hasMore: false,
        }
        vi.mocked(request).mockResolvedValueOnce(okResponse(mockPage))
        const page = await svc.getHistory(2, 15)
        expect(request).toHaveBeenCalledWith({
            method: 'GET',
            path: '/notifications/history',
            query: { page: '2', limit: '15' },
        })
        expect(page).toEqual(mockPage)
    })

    it('markRead sends PATCH /notifications/:id/read', async () => {
        vi.mocked(request).mockResolvedValueOnce(okResponse(undefined))
        await svc.markRead('n42')
        expect(request).toHaveBeenCalledWith({
            method: 'PATCH',
            path: '/notifications/n42/read',
        })
    })

    it('markAllRead sends PATCH /notifications/read-all', async () => {
        vi.mocked(request).mockResolvedValueOnce(okResponse(undefined))
        await svc.markAllRead()
        expect(request).toHaveBeenCalledWith({
            method: 'PATCH',
            path: '/notifications/read-all',
        })
    })
})