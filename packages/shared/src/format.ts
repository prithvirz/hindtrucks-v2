// Formatting helpers shared by both apps.

/** ₹18,500 — Indian-grouped rupee amount, no decimals. */
export function formatRupees(amount: number): string {
  return '₹' + Math.round(amount).toLocaleString('en-IN')
}

/** 281 km */
export function formatDistance(km: number): string {
  return `${Math.round(km)} km`
}

/** 9 Ton */
export function formatWeight(ton: number): string {
  return `${ton} Ton`
}

/** Short, stable id like "B" + base36 timestamp. Pass a timestamp for determinism. */
export function makeId(prefix: string, ts: number): string {
  return prefix + ts.toString(36).toUpperCase()
}
