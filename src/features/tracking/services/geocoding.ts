import type { Coordinates } from '../types';

// Static lookup of major Indian cities → coordinates. Covers freight corridors
// and every city used in mock loads. Offline + instant; no API needed for the
// common case. Keys are lowercased city names.
const CITY_COORDS: Record<string, { lat: number; lng: number }> = {
    delhi: { lat: 28.6139, lng: 77.209 },
    'new delhi': { lat: 28.6139, lng: 77.209 },
    gurugram: { lat: 28.4595, lng: 77.0266 },
    gurgaon: { lat: 28.4595, lng: 77.0266 },
    noida: { lat: 28.5355, lng: 77.391 },
    faridabad: { lat: 28.4089, lng: 77.3178 },
    ghaziabad: { lat: 28.6692, lng: 77.4538 },
    mumbai: { lat: 19.076, lng: 72.8777 },
    pune: { lat: 18.5204, lng: 73.8567 },
    nashik: { lat: 19.9975, lng: 73.7898 },
    nagpur: { lat: 21.1458, lng: 79.0882 },
    thane: { lat: 19.2183, lng: 72.9781 },
    'navi mumbai': { lat: 19.033, lng: 73.0297 },
    aurangabad: { lat: 19.8762, lng: 75.3433 },
    kolhapur: { lat: 16.705, lng: 74.2433 },
    chennai: { lat: 13.0827, lng: 80.2707 },
    bengaluru: { lat: 12.9716, lng: 77.5946 },
    bangalore: { lat: 12.9716, lng: 77.5946 },
    coimbatore: { lat: 11.0168, lng: 76.9558 },
    madurai: { lat: 9.9252, lng: 78.1198 },
    tiruchirappalli: { lat: 10.7905, lng: 78.7047 },
    salem: { lat: 11.6643, lng: 78.146 },
    hyderabad: { lat: 17.385, lng: 78.4867 },
    vijayawada: { lat: 16.5062, lng: 80.648 },
    visakhapatnam: { lat: 17.6868, lng: 83.2185 },
    guntur: { lat: 16.3067, lng: 80.4365 },
    warangal: { lat: 17.9689, lng: 79.5941 },
    tirupati: { lat: 13.6288, lng: 79.4192 },
    jaipur: { lat: 26.9124, lng: 75.7873 },
    jodhpur: { lat: 26.2389, lng: 73.0243 },
    udaipur: { lat: 24.5854, lng: 73.7125 },
    kota: { lat: 25.2138, lng: 75.8648 },
    ajmer: { lat: 26.4499, lng: 74.6399 },
    bikaner: { lat: 28.0229, lng: 73.3119 },
    ludhiana: { lat: 30.901, lng: 75.8573 },
    amritsar: { lat: 31.634, lng: 74.8723 },
    jalandhar: { lat: 31.326, lng: 75.5762 },
    patiala: { lat: 30.3398, lng: 76.3869 },
    chandigarh: { lat: 30.7333, lng: 76.7794 },
    ahmedabad: { lat: 23.0225, lng: 72.5714 },
    surat: { lat: 21.1702, lng: 72.8311 },
    vadodara: { lat: 22.3072, lng: 73.1812 },
    rajkot: { lat: 22.3039, lng: 70.8022 },
    bhavnagar: { lat: 21.7645, lng: 72.1519 },
    jamnagar: { lat: 22.4707, lng: 70.0577 },
    kanpur: { lat: 26.4499, lng: 80.3319 },
    lucknow: { lat: 26.8467, lng: 80.9462 },
    agra: { lat: 27.1767, lng: 78.0081 },
    varanasi: { lat: 25.3176, lng: 82.9739 },
    meerut: { lat: 28.9845, lng: 77.7064 },
    allahabad: { lat: 25.4358, lng: 81.8463 },
    prayagraj: { lat: 25.4358, lng: 81.8463 },
    bareilly: { lat: 28.367, lng: 79.4304 },
    aligarh: { lat: 27.8974, lng: 78.088 },
    gorakhpur: { lat: 26.7606, lng: 83.3732 },
    kolkata: { lat: 22.5726, lng: 88.3639 },
    howrah: { lat: 22.5958, lng: 88.2636 },
    durgapur: { lat: 23.5204, lng: 87.3119 },
    siliguri: { lat: 26.7271, lng: 88.3953 },
    asansol: { lat: 23.6739, lng: 86.9524 },
    patna: { lat: 25.5941, lng: 85.1376 },
    gaya: { lat: 24.7969, lng: 85.0002 },
    muzaffarpur: { lat: 26.1209, lng: 85.3647 },
    ranchi: { lat: 23.3441, lng: 85.3096 },
    jamshedpur: { lat: 22.8046, lng: 86.2029 },
    dhanbad: { lat: 23.7957, lng: 86.4304 },
    bhubaneswar: { lat: 20.2961, lng: 85.8245 },
    cuttack: { lat: 20.4625, lng: 85.8828 },
    rourkela: { lat: 22.2604, lng: 84.8536 },
    raipur: { lat: 21.2514, lng: 81.6296 },
    bhilai: { lat: 21.1938, lng: 81.3509 },
    bilaspur: { lat: 22.0797, lng: 82.1409 },
    bhopal: { lat: 23.2599, lng: 77.4126 },
    indore: { lat: 22.7196, lng: 75.8577 },
    jabalpur: { lat: 23.1815, lng: 79.9864 },
    gwalior: { lat: 26.2183, lng: 78.1828 },
    ujjain: { lat: 23.1765, lng: 75.7885 },
    kochi: { lat: 9.9312, lng: 76.2673 },
    thiruvananthapuram: { lat: 8.5241, lng: 76.9366 },
    kozhikode: { lat: 11.2588, lng: 75.7804 },
    thrissur: { lat: 10.5276, lng: 76.2144 },
    guwahati: { lat: 26.1445, lng: 91.7362 },
    dibrugarh: { lat: 27.4728, lng: 94.912 },
    dehradun: { lat: 30.3165, lng: 78.0322 },
    haridwar: { lat: 29.9457, lng: 78.1642 },
    jammu: { lat: 32.7266, lng: 74.857 },
    srinagar: { lat: 34.0837, lng: 74.7973 },
    panaji: { lat: 15.4909, lng: 73.8278 },
    mangaluru: { lat: 12.9141, lng: 74.856 },
    mysuru: { lat: 12.2958, lng: 76.6394 },
    hubballi: { lat: 15.3647, lng: 75.124 },
    belagavi: { lat: 15.8497, lng: 74.4977 },
};

// Geographic centre of India — last-resort fallback so the map never breaks.
const INDIA_CENTER = { lat: 22.5937, lng: 78.9629 };

function normalize(city: string): string {
    return city.trim().toLowerCase();
}

/** Synchronous lookup from the built-in table. Returns null if unknown. */
export function lookupCity(city: string): Coordinates | null {
    const hit = CITY_COORDS[normalize(city)];
    if (!hit) return null;
    return { lat: hit.lat, lng: hit.lng, timestamp: Date.now() };
}

/**
 * Resolve a city name to coordinates. Tries the offline table first; on a miss,
 * queries the free OSM Nominatim geocoder; if that fails (offline / rate limit),
 * returns the centre of India so the UI always has a valid point.
 */
export async function geocodeCity(city: string): Promise<Coordinates> {
    const local = lookupCity(city);
    if (local) return local;

    try {
        const url =
            'https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=in&q=' +
            encodeURIComponent(city);
        const res = await fetch(url, { headers: { 'Accept-Language': 'en' } });
        if (res.ok) {
            const data = (await res.json()) as Array<{ lat: string; lon: string }>;
            if (data.length > 0) {
                return {
                    lat: parseFloat(data[0].lat),
                    lng: parseFloat(data[0].lon),
                    timestamp: Date.now(),
                };
            }
        }
    } catch {
        // Offline or blocked — fall through to default.
    }

    return { ...INDIA_CENTER, timestamp: Date.now() };
}
