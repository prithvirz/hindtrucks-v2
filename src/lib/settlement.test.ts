import { calculateTripSettlement } from './settlement'

describe('calculateTripSettlement', () => {
  it('cuts first-trip marketing support from HindTrucks commission', () => {
    expect(calculateTripSettlement(12800, true)).toEqual({
      grossAmount: 12800,
      commissionRate: 0.1,
      commissionAmount: 1280,
      marketingSupport: 500,
      platformCommission: 780,
      driverPayout: 12020,
    })
  })

  it('charges normal commission after the first trip', () => {
    expect(calculateTripSettlement(12800, false)).toEqual({
      grossAmount: 12800,
      commissionRate: 0.1,
      commissionAmount: 1280,
      marketingSupport: 0,
      platformCommission: 1280,
      driverPayout: 11520,
    })
  })
})
