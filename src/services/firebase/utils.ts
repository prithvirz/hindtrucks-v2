import type { Load as DriverLoad } from '../types'
import type { Load as SharedLoad } from '@hindtrucks/shared'

/** Convert shared Load (with optional status/shipperUid/driverUid/createdAt) 
    to driver Load (without those fields). */
export function toDriverLoad(shared: SharedLoad): DriverLoad {
    return {
        id: shared.id,
        fromCity: shared.fromCity,
        fromArea: shared.fromArea,
        toCity: shared.toCity,
        toArea: shared.toArea,
        goods: shared.goods,
        weightTon: shared.weightTon,
        distanceKm: shared.distanceKm,
        price: shared.price,
        advance: shared.advance,
        truckType: shared.truckType,
        shipperName: shared.shipperName,
        shipperVerified: shared.shipperVerified,
        image: shared.image,
    }
}