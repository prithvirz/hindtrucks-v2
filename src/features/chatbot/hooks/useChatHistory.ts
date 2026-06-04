import { useState, useEffect, useCallback } from 'react'
import type { ChatMessage } from '../types'

// ─── useChatHistory: IndexedDB Persistence ───
// DB: hindtrucks_chat | Store: messages
// Max: 50 messages retained, auto-purge older than 30 days

const DB_NAME = 'hindtrucks_chat'
const STORE_NAME = 'messages'
const DB_VERSION = 1
const MAX_MESSAGES = 50
const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000 // 30 days

function openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION)
        request.onupgradeneeded = () => {
            const db = request.result
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: 'id' })
            }
        }
        request.onsuccess = () => resolve(request.result)
        request.onerror = () => reject(request.error)
    })
}

function purgeOldMessages(db: IDBDatabase): Promise<void> {
    return new Promise((resolve) => {
        const tx = db.transaction(STORE_NAME, 'readwrite')
        const store = tx.objectStore(STORE_NAME)
        const cutoff = Date.now() - MAX_AGE_MS
        const range = IDBKeyRange.upperBound(cutoff, true)

        const cursorReq = store.openCursor(range)
        const deletePromises: Promise<void>[] = []

        cursorReq.onsuccess = () => {
            const cursor = cursorReq.result
            if (cursor) {
                // Cursor key is message id (string), need to check timestamp
                const msg = cursor.value as ChatMessage
                if (msg.timestamp < cutoff) {
                    deletePromises.push(
                        new Promise<void>((res) => {
                            const delReq = cursor.delete()
                            delReq.onsuccess = () => res()
                            delReq.onerror = () => res()
                        })
                    )
                }
                cursor.continue()
            } else {
                Promise.all(deletePromises).then(() => resolve())
            }
        }
        cursorReq.onerror = () => resolve()
    })
}

export function useChatHistory() {
    const [messages, setMessages] = useState<ChatMessage[]>([])
    const [isLoaded] = useState(true) // always fresh — no history loaded on mount

    const loadHistory = useCallback(async () => {
        try {
            const db = await openDB()
            await purgeOldMessages(db)

            const tx = db.transaction(STORE_NAME, 'readonly')
            const store = tx.objectStore(STORE_NAME)
            const getAllReq = store.getAll()

            const storedMessages: ChatMessage[] = await new Promise((resolve, reject) => {
                getAllReq.onsuccess = () => resolve(getAllReq.result || [])
                getAllReq.onerror = () => reject(getAllReq.error)
            })

            // Sort by timestamp, take last 50
            const sorted = storedMessages
                .sort((a, b) => a.timestamp - b.timestamp)
                .slice(-MAX_MESSAGES)

            setMessages(sorted)
        } catch {
            // Silently fail
        }
    }, [])

    const addMessage = useCallback(async (msg: ChatMessage) => {
        try {
            const db = await openDB()
            const tx = db.transaction(STORE_NAME, 'readwrite')
            const store = tx.objectStore(STORE_NAME)
            store.put(msg)

            await new Promise<void>((resolve, reject) => {
                tx.oncomplete = () => resolve()
                tx.onerror = () => reject(tx.error)
            })
        } catch {
            // Silently fail — offline/mock mode
        }
    }, [])

    const clearHistory = useCallback(async () => {
        try {
            const db = await openDB()
            const tx = db.transaction(STORE_NAME, 'readwrite')
            const store = tx.objectStore(STORE_NAME)
            store.clear()

            await new Promise<void>((resolve, reject) => {
                tx.oncomplete = () => resolve()
                tx.onerror = () => reject(tx.error)
            })

            setMessages([])
        } catch {
            // Silently fail
        }
    }, [])

    // Clear any zombie messages from a previous session on mount.
    // Chat is session-scoped: fresh on every app load / login.
    useEffect(() => {
        clearHistory()
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    return { messages, setMessages, loadHistory, addMessage, clearHistory, isLoaded }
}