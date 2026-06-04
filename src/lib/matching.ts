import { Load } from '../data/mockLoads'

export interface TruckItem {
  id: string
  regNumber: string
  type: string      // e.g. "19 ft Container", "32 ft Container"
  capacity: string  // e.g. "9 Ton", "21 Ton"
  isActive?: boolean
}

/**
 * Extracts the first numeric value from a string (e.g. "19 ft Container" -> 19, "9 Ton" -> 9)
 */
function parseNumber(val: string | number): number {
  if (typeof val === 'number') return val
  const match = val.match(/(\d+(\.\d+)?)/)
  return match ? parseFloat(match[1]) : 0
}

/**
 * Checks if a specific truck matches the requirements of a load.
 * A truck matches if:
 * 1. Its capacity in Tons is greater than or equal to the load's weight in Tons.
 * 2. Its length in feet is greater than or equal to the load's length requirement.
 */
export function isTruckCompatible(load: Load, truck: TruckItem): boolean {
  const truckCapacity = parseNumber(truck.capacity)
  const truckLength = parseNumber(truck.type)

  const loadWeight = load.weightTon
  const loadLength = parseNumber(load.truckType)

  if (truckCapacity === 0 || truckLength === 0) return false

  return truckCapacity >= loadWeight && truckLength >= loadLength
}

/**
 * Returns all compatible trucks in the fleet for a given load.
 */
export function getCompatibleTrucks(load: Load, trucks: TruckItem[]): TruckItem[] {
  if (!Array.isArray(trucks)) return []
  return trucks.filter((truck) => isTruckCompatible(load, truck))
}
