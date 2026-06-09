export const DEFAULT_COMMISSION_RATE = 0.1
export const FIRST_TRIP_MARKETING_SUPPORT = 500

export interface TripSettlement {
  grossAmount: number
  commissionRate: number
  commissionAmount: number
  marketingSupport: number
  platformCommission: number
  driverPayout: number
}

export function calculateTripSettlement(
  grossAmount: number,
  isFirstTrip: boolean,
  commissionRate = DEFAULT_COMMISSION_RATE,
): TripSettlement {
  const amount = Math.max(0, Math.round(grossAmount))
  const commissionAmount = Math.round(amount * commissionRate)
  const marketingSupport = isFirstTrip
    ? Math.min(FIRST_TRIP_MARKETING_SUPPORT, commissionAmount)
    : 0
  const platformCommission = commissionAmount - marketingSupport

  return {
    grossAmount: amount,
    commissionRate,
    commissionAmount,
    marketingSupport,
    platformCommission,
    driverPayout: amount - platformCommission,
  }
}
