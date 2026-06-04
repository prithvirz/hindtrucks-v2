import type {
    ILoadsService,
    GetLoadsRequest,
    GetLoadsResponse,
    GetLoadDetailRequest,
    GetLoadDetailResponse,
    AcceptLoadRequest,
    AcceptLoadResponse,
} from '../types'
import { MOCK_LOADS } from '../../data/mockLoads'

const delay = () => new Promise<void>((r) => setTimeout(r, 300 + Math.random() * 500))

export const mockLoadsService: ILoadsService = {
    async getLoads(request?: GetLoadsRequest): Promise<GetLoadsResponse> {
        await delay()

        let loads = [...MOCK_LOADS]

        if (request) {
            if (request.goods) {
                loads = loads.filter((l) => l.goods === request.goods)
            }
            if (request.minPrice !== undefined) {
                loads = loads.filter((l) => l.price >= request.minPrice!)
            }
            if (request.maxPrice !== undefined) {
                loads = loads.filter((l) => l.price <= request.maxPrice!)
            }
            if (request.fromCity) {
                const from = request.fromCity.toLowerCase()
                loads = loads.filter((l) => l.fromCity.toLowerCase().includes(from))
            }
            if (request.toCity) {
                const to = request.toCity.toLowerCase()
                loads = loads.filter((l) => l.toCity.toLowerCase().includes(to))
            }
        }

        return {
            data: loads,
            total: loads.length,
            page: request?.page ?? 1,
            pageSize: request?.pageSize ?? 20,
            hasMore: false,
        }
    },

    async getLoadDetail(request: GetLoadDetailRequest): Promise<GetLoadDetailResponse> {
        await delay()
        const load = MOCK_LOADS.find((l) => l.id === request.loadId)
        if (!load) {
            throw new Error('Load not found')
        }
        return { load }
    },

    async acceptLoad(request: AcceptLoadRequest): Promise<AcceptLoadResponse> {
        await delay()
        const load = MOCK_LOADS.find((l) => l.id === request.loadId)
        if (!load) {
            throw new Error('Load not found')
        }
        return { success: true, activeLoad: load, tripStep: 1 }
    },
}