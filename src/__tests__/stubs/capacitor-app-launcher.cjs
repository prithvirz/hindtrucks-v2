// CJS stub for @capacitor/app-launcher — loaded via Node.js Module._resolveFilename patch.
// Must be CJS (not ESM) because the preload runs before any transpilation.

'use strict';

const core = require('@capacitor/core');

class AppLauncherWeb extends core.WebPlugin {
    async openUrl(options) {
        return { completed: true };
    }
}

const AppLauncher = {
    canOpenUrl: () => Promise.resolve({ value: true }),
    openUrl: () => Promise.resolve({ completed: true }),
};

module.exports = {
    AppLauncher,
    AppLauncherWeb,
};