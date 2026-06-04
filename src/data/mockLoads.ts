import { goodsImage } from '../assets'

export type GoodsKey = 'electronics' | 'furniture' | 'containers' | 'parcels'

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
}

export const MOCK_LOADS: Load[] = [
  {
    id: 'L1042',
    fromCity: 'Delhi',
    fromArea: 'Okhla Industrial Area',
    toCity: 'Jaipur',
    toArea: 'Sitapura',
    goods: 'electronics',
    weightTon: 9,
    distanceKm: 281,
    price: 18500,
    advance: 6000,
    truckType: '19 ft · 9 Ton',
    shipperName: 'Sharma Electronics',
    shipperVerified: true,
    image: goodsImage.electronics,
  },
  {
    id: 'L1043',
    fromCity: 'Mumbai',
    fromArea: 'Bhiwandi',
    toCity: 'Pune',
    toArea: 'Chakan MIDC',
    goods: 'furniture',
    weightTon: 6,
    distanceKm: 148,
    price: 9200,
    advance: 3000,
    truckType: '17 ft · 6 Ton',
    shipperName: 'Royal Furnishings',
    shipperVerified: true,
    image: goodsImage.furniture,
  },
  {
    id: 'L1044',
    fromCity: 'Chennai',
    fromArea: 'Ennore Port',
    toCity: 'Bengaluru',
    toArea: 'Hosur Road',
    goods: 'containers',
    weightTon: 21,
    distanceKm: 347,
    price: 27400,
    advance: 9000,
    truckType: '32 ft · 21 Ton',
    shipperName: 'Coastal Cargo Lines',
    shipperVerified: false,
    image: goodsImage.containers,
  },
  {
    id: 'L1045',
    fromCity: 'Ludhiana',
    fromArea: 'Focal Point',
    toCity: 'Delhi',
    toArea: 'Narela',
    goods: 'parcels',
    weightTon: 4,
    distanceKm: 312,
    price: 12800,
    advance: 4000,
    truckType: '14 ft · 4 Ton',
    shipperName: 'Punjab Knitwear Co.',
    shipperVerified: true,
    image: goodsImage.parcels,
  },
  {
    id: 'L1046',
    fromCity: 'Hyderabad',
    fromArea: 'Jeedimetla',
    toCity: 'Vijayawada',
    toArea: 'Auto Nagar',
    goods: 'electronics',
    weightTon: 7,
    distanceKm: 275,
    price: 16100,
    advance: 5000,
    truckType: '19 ft · 7 Ton',
    shipperName: 'Deccan Devices',
    shipperVerified: true,
    image: goodsImage.electronics,
  },
]

export interface Payout {
  id: string
  load: string
  route: string
  amount: number
  status: 'credited' | 'pending'
  date: string
}

export const MOCK_PAYOUTS: Payout[] = [
  { id: 'P9001', load: 'L1031', route: 'Delhi → Agra', amount: 11200, status: 'credited', date: 'Mon, 2 Jun' },
  { id: 'P9000', load: 'L1029', route: 'Jaipur → Delhi', amount: 17800, status: 'credited', date: 'Sat, 31 May' },
  { id: 'P8999', load: 'L1026', route: 'Delhi → Kanpur', amount: 14500, status: 'pending', date: 'Thu, 29 May' },
  { id: 'P8998', load: 'L1021', route: 'Agra → Delhi', amount: 9600, status: 'credited', date: 'Tue, 27 May' },
]

// Bars for the "this week" earnings chart (Mon–Sun, in ₹)
export const WEEK_EARNINGS = [11200, 0, 14500, 9600, 17800, 11200, 0]

export const DRIVER = {
  name: 'Rajbir Singh',
  phone: '+91 98765 43210',
  rating: 4.8,
  tripsToday: 2,
  earningsToday: 23800,
  walletBalance: 41250,
  truck: {
    regNumber: 'PB10 AB 4521',
    type: '19 ft Container',
    capacity: '9 Ton',
  },
}
