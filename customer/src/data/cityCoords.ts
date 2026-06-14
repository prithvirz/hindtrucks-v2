// Minimal city → [lat, lng] lookup for the mock tracking map.
export const CITY_COORDS: Record<string, [number, number]> = {
  delhi: [28.6139, 77.209],
  jaipur: [26.9124, 75.7873],
  mumbai: [19.076, 72.8777],
  pune: [18.5204, 73.8567],
  chennai: [13.0827, 80.2707],
  bengaluru: [12.9716, 77.5946],
  bangalore: [12.9716, 77.5946],
  ludhiana: [30.901, 75.8573],
  hyderabad: [17.385, 78.4867],
  vijayawada: [16.5062, 80.648],
  ahmedabad: [23.0225, 72.5714],
  surat: [21.1702, 72.8311],
  kolkata: [22.5726, 88.3639],
  nagpur: [21.1458, 79.0882],
  kanpur: [26.4499, 80.3319],
  agra: [27.1767, 78.0081],
}

export const INDIA_CENTER: [number, number] = [22.9734, 78.6569]

export function lookupCity(name: string): [number, number] | null {
  return CITY_COORDS[name.trim().toLowerCase()] ?? null
}
