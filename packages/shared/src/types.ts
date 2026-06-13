// Shared domain types for both the driver and customer apps.
// The driver app currently keeps its own copy of `Load`; this is the
// source-of-truth both should converge on. New fields are optional so the
// existing driver Firestore documents stay backward-compatible.

export type GoodsKey = 'electronics' | 'furniture' | 'containers' | 'parcels'

/** Lifecycle of a load on the marketplace. */
export type LoadStatus =
  | 'available' // posted by a shipper, no driver yet
  | 'accepted' // a driver claimed it; trip not yet moving
  | 'in_transit' // driver picked up the goods
  | 'completed' // delivered
  | 'cancelled' // shipper cancelled before pickup

export interface Load {
  id: string
  fromCity: string
  fromArea: string
  toCity: string
  toArea: string
  goods: GoodsKey
  weightTon: number
  distanceKm: number
  price: number
  advance: number
  truckType: string
  shipperName: string
  shipperVerified: boolean
  image: string
  /** Set when a customer (shipper) posts the load — lets them query "my bookings". */
  shipperUid?: string
  /** Marketplace lifecycle status. Absent on legacy driver-seeded loads (treat as 'available'). */
  status?: LoadStatus
  /** Uid of the driver who claimed the load, once accepted. */
  driverUid?: string
  /** Epoch ms the load was created. */
  createdAt?: number
}

/** A driver's live position, written per-trip and read by the shipper to track. */
export interface TruckPosition {
  lat: number
  lng: number
  heading: number | null
  speed: number | null
  recordedAt: number
}

/** 0 = none, 1..4 = pickup / loaded / in-transit / delivered. */
export type TripStep = 0 | 1 | 2 | 3 | 4
