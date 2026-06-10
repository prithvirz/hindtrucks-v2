// CJS stub for @capacitor/core — loaded via Node.js Module._resolveFilename patch.
// Must be CJS format (not ESM) because the preload runs before any transpilation.

'use strict';

class CapacitorException extends Error {
    constructor(message, code) {
        super(message);
        this.code = code;
    }
}

class WebPlugin {
    get open() {
        return window;
    }
    async addListener() { return { remove: async () => { } }; }
    async removeAllListeners() { }
    notifyListeners() { }
    hasListeners() { return false; }
    registerWindowListener() { }
    removeWindowListener() { }
}

const registeredPlugins = new Map();

const Capacitor = {
    isNativePlatform: () => false,
    getPlatform: () => 'web',
    isPluginAvailable: () => false,
};

function registerPlugin(pluginName, jsImplementations) {
    return {};
}

const CapacitorCookies = {
    getCookies: () => Promise.resolve({}),
    setCookie: () => Promise.resolve(),
    deleteCookie: () => Promise.resolve(),
    clearAllCookies: () => Promise.resolve(),
    clearCookies: () => Promise.resolve(),
};

const CapacitorHttp = {
    request: () => Promise.resolve({ data: {} }),
    get: () => Promise.resolve({ data: {} }),
    post: () => Promise.resolve({ data: {} }),
};

module.exports = {
    Capacitor,
    CapacitorCookies,
    CapacitorHttp,
    CapacitorException,
    WebPlugin,
    registerPlugin,
    registeredPlugins,
};