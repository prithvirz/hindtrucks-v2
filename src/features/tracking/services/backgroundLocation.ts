import { registerPlugin } from '@capacitor/core';
import type {
    BackgroundGeolocationPlugin,
    Location as PluginLocation,
    WatcherOptions,
} from '@capacitor-community/background-geolocation';
import type { Coordinates } from '../types';

// The plugin ships no JS bundle — register it against the native implementation.
const BackgroundGeolocation = registerPlugin<BackgroundGeolocationPlugin>('BackgroundGeolocation');

export interface BackgroundWatchOptions {
    /** Foreground-service notification title shown while tracking. */
    backgroundTitle?: string;
    /** Foreground-service notification body. Presence enables background delivery. */
    backgroundMessage?: string;
    /** Metres of movement before a new fix is delivered. Larger = more battery-saving. */
    distanceFilter?: number;
    /** Let the plugin show the runtime permission dialog if not yet granted. */
    requestPermissions?: boolean;
}

export type BackgroundLocationCallback = (coords: Coordinates) => void;
export type BackgroundLocationErrorCallback = (code: string | undefined, message: string) => void;

function toCoordinates(loc: PluginLocation): Coordinates {
    return {
        lat: loc.latitude,
        lng: loc.longitude,
        accuracy: loc.accuracy,
        heading: loc.bearing ?? undefined,
        speed: loc.speed ?? undefined,
        timestamp: loc.time ?? Date.now(),
    };
}

/**
 * Start a background-capable location watcher (native foreground service on
 * Android). Returns the watcher id needed to stop it. Delivering a
 * `backgroundMessage` is what keeps fixes flowing while the app is
 * backgrounded, the screen is off, or the process is killed by the OS.
 */
export async function startBackgroundWatch(
    opts: BackgroundWatchOptions,
    onLocation: BackgroundLocationCallback,
    onError?: BackgroundLocationErrorCallback,
): Promise<string> {
    const options: WatcherOptions = {
        backgroundTitle: opts.backgroundTitle ?? 'HindTrucks is tracking your trip',
        backgroundMessage: opts.backgroundMessage ?? 'Location is shared while your trip is active.',
        requestPermissions: opts.requestPermissions ?? true,
        stale: false,
        distanceFilter: opts.distanceFilter ?? 20,
    };

    return BackgroundGeolocation.addWatcher(options, (position, error) => {
        if (error) {
            onError?.(error.code, error.message);
            return;
        }
        if (position) onLocation(toCoordinates(position));
    });
}

export async function stopBackgroundWatch(id: string): Promise<void> {
    await BackgroundGeolocation.removeWatcher({ id });
}

/** Open the OS app-settings page (used when the user denied "Allow all the time"). */
export async function openLocationSettings(): Promise<void> {
    await BackgroundGeolocation.openSettings();
}
