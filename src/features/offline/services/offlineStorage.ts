import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { OfflineAction, CachedResponse } from '../types';

interface HindTrucksDB extends DBSchema {
    offline_actions: {
        key: string;
        value: OfflineAction;
        indexes: {
            'by-status': string;
            'by-created': number;
        };
    };
    cached_responses: {
        key: string;
        value: CachedResponse;
        indexes: {
            'by-ttl': number;
        };
    };
    user_preferences: {
        key: string;
        value: unknown;
    };
}

const DB_NAME = 'hindtrucks_offline';
const DB_VERSION = 1;

let dbInstance: IDBPDatabase<HindTrucksDB> | null = null;

export async function getDB(): Promise<IDBPDatabase<HindTrucksDB>> {
    if (dbInstance) return dbInstance;

    dbInstance = await openDB<HindTrucksDB>(DB_NAME, DB_VERSION, {
        upgrade(db) {
            // offline_actions store
            if (!db.objectStoreNames.contains('offline_actions')) {
                const actionsStore = db.createObjectStore('offline_actions', { keyPath: 'id' });
                actionsStore.createIndex('by-status', 'status');
                actionsStore.createIndex('by-created', 'createdAt');
            }

            // cached_responses store
            if (!db.objectStoreNames.contains('cached_responses')) {
                const cacheStore = db.createObjectStore('cached_responses', { keyPath: 'key' });
                cacheStore.createIndex('by-ttl', 'cachedAt');
            }

            // user_preferences store
            if (!db.objectStoreNames.contains('user_preferences')) {
                db.createObjectStore('user_preferences', { keyPath: 'key' });
            }
        },
    });

    return dbInstance;
}

// ─── Offline Actions ───

export async function addOfflineAction(action: OfflineAction): Promise<void> {
    const db = await getDB();
    await db.add('offline_actions', action);
}

export async function getAllOfflineActions(): Promise<OfflineAction[]> {
    const db = await getDB();
    return db.getAll('offline_actions');
}

export async function getPendingActions(): Promise<OfflineAction[]> {
    const db = await getDB();
    return db.getAllFromIndex('offline_actions', 'by-status', 'pending');
}

export async function getPendingActionCount(): Promise<number> {
    const db = await getDB();
    return db.countFromIndex('offline_actions', 'by-status', 'pending');
}

export async function updateOfflineAction(id: string, updates: Partial<OfflineAction>): Promise<void> {
    const db = await getDB();
    const tx = db.transaction('offline_actions', 'readwrite');
    const store = tx.objectStore('offline_actions');
    const existing = await store.get(id);
    if (existing) {
        await store.put({ ...existing, ...updates });
    }
    await tx.done;
}

export async function removeOfflineAction(id: string): Promise<void> {
    const db = await getDB();
    await db.delete('offline_actions', id);
}

export async function clearAllActions(): Promise<void> {
    const db = await getDB();
    await db.clear('offline_actions');
}

// ─── Cached Responses ───

export async function getCachedResponse(key: string): Promise<CachedResponse | undefined> {
    const db = await getDB();
    return db.get('cached_responses', key);
}

export async function setCachedResponse(response: CachedResponse): Promise<void> {
    const db = await getDB();
    await db.put('cached_responses', response);
}

export async function clearExpiredCache(): Promise<void> {
    const db = await getDB();
    const now = Date.now();
    const all = await db.getAll('cached_responses');
    for (const entry of all) {
        if (now - entry.cachedAt > entry.ttl) {
            await db.delete('cached_responses', entry.key);
        }
    }
}

// ─── User Preferences ───

export async function getPreference<T>(key: string): Promise<T | undefined> {
    const db = await getDB();
    return db.get('user_preferences', key) as Promise<T | undefined>;
}

export async function setPreference<T>(key: string, value: T): Promise<void> {
    const db = await getDB();
    await db.put('user_preferences', { key, value });
}

export async function deletePreference(key: string): Promise<void> {
    const db = await getDB();
    await db.delete('user_preferences', key);
}