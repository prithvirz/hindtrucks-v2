// ─── notificationsService.test.ts (mock) ───

import { createMockNotificationsService } from '../notificationsService'
import type { INotificationsService } from '../../types'

describe('createMockNotificationsService', () => {
    let svc: INotificationsService

    beforeEach(() => {
        svc = createMockNotificationsService()
    })

    it('registers and unregisters tokens', () => {
        // registerToken + unregisterToken are noop for assertions,
        // but they should not throw.
        expect(() => svc.registerToken('tok-1')).not.toThrow()
        expect(() => svc.unregisterToken('tok-1')).not.toThrow()
    })

    it('subscribes and unsubscribes from topics', () => {
        expect(() => svc.subscribeToTopic('loads')).not.toThrow()
        expect(() => svc.unsubscribeFromTopic('loads')).not.toThrow()
    })

    it('getHistory returns empty page by default', async () => {
        const page = await svc.getHistory(1, 10)
        expect(page.items).toEqual([])
        expect(page.total).toBe(0)
        expect(page.page).toBe(1)
        expect(page.limit).toBe(10)
        expect(page.hasMore).toBe(false)
    })

    it('markRead and markAllRead do not throw on empty store', async () => {
        await expect(svc.markRead('any-id')).resolves.toBeUndefined()
        await expect(svc.markAllRead()).resolves.toBeUndefined()
    })
})