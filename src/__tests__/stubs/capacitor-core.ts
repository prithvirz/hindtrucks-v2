// ESM stub for @capacitor/core
export const Capacitor = {
    isNativePlatform: (): boolean => false,
    getPlatform: (): string => 'web',
    isPluginAvailable: (_pluginName: string): boolean => false,
    addListener: (_eventName: string, _callback: Function) => ({ remove: () => { } }),
}

export const registerPlugin = (_pluginName: string, _jsImplementations?: Record<string, unknown>) => ({})
export { registerPlugin as default }

export class WebPlugin {
    addListener(_eventName: string, _listenerFunc: Function) {
        return Promise.resolve({ remove: async () => { } })
    }
    async removeAllListeners() { }
    notifyListeners(_eventName: string, _data?: unknown) { }
    hasListeners(_eventName: string) { return false }
    registerWindowListener(_windowEventName: string, _pluginEventName: string) { }
    removeWindowListener(_handle: { remove: () => void }) { }
}

export class CapacitorException extends Error {
    constructor(message: string, _code?: string) {
        super(message)
        this.name = 'CapacitorException'
    }
}

export const ExceptionCode = {}

export class CapacitorCookies {
    async getCookies() { return {} }
    async setCookie(_options: unknown) { }
    async deleteCookie(_options: unknown) { }
    async clearCookies() { }
    async clearAllCookies() { }
}

export class CapacitorHttp {
    async request(_options: unknown) { return { data: {} } }
    async get(_options: unknown) { return { data: {} } }
    async post(_options: unknown) { return { data: {} } }
}

export class WebView { }
export const buildRequestInit = (_options: unknown, _extra?: unknown) => ({})