import { collection, getDocs, addDoc, serverTimestamp, query, limit } from 'firebase/firestore'
import { db } from './firebase'
import { goodsImage } from './assets'

const SEED_LOADS = [
  {
    fromCity: 'Delhi', fromArea: 'Okhla Industrial Area',
    toCity: 'Jaipur', toArea: 'Sitapura',
    goods: 'electronics', weightTon: 9, distanceKm: 281,
    price: 18500, advance: 6000, truckType: '19 ft · 9 Ton',
    shipperName: 'Sharma Electronics', shipperVerified: true,
    image: goodsImage.electronics, status: 'available',
  },
  {
    fromCity: 'Mumbai', fromArea: 'Bhiwandi',
    toCity: 'Pune', toArea: 'Chakan MIDC',
    goods: 'furniture', weightTon: 6, distanceKm: 148,
    price: 9200, advance: 3000, truckType: '17 ft · 6 Ton',
    shipperName: 'Royal Furnishings', shipperVerified: true,
    image: goodsImage.furniture, status: 'available',
  },
  {
    fromCity: 'Chennai', fromArea: 'Ennore Port',
    toCity: 'Bengaluru', toArea: 'Hosur Road',
    goods: 'containers', weightTon: 21, distanceKm: 347,
    price: 27400, advance: 9000, truckType: '32 ft · 21 Ton',
    shipperName: 'Coastal Cargo Lines', shipperVerified: false,
    image: goodsImage.containers, status: 'available',
  },
  {
    fromCity: 'Ludhiana', fromArea: 'Focal Point',
    toCity: 'Delhi', toArea: 'Narela',
    goods: 'parcels', weightTon: 4, distanceKm: 312,
    price: 12800, advance: 4000, truckType: '14 ft · 4 Ton',
    shipperName: 'Punjab Knitwear Co.', shipperVerified: true,
    image: goodsImage.parcels, status: 'available',
  },
  {
    fromCity: 'Hyderabad', fromArea: 'Jeedimetla',
    toCity: 'Vijayawada', toArea: 'Auto Nagar',
    goods: 'electronics', weightTon: 7, distanceKm: 275,
    price: 16100, advance: 5000, truckType: '19 ft · 7 Ton',
    shipperName: 'Deccan Devices', shipperVerified: true,
    image: goodsImage.electronics, status: 'available',
  },
]

export async function seedLoadsIfEmpty() {
  const snap = await getDocs(query(collection(db, 'loads'), limit(1)))
  if (!snap.empty) return
  await Promise.all(
    SEED_LOADS.map((load) => addDoc(collection(db, 'loads'), { ...load, createdAt: serverTimestamp() }))
  )
  console.info('[seed] Seeded 5 loads into Firestore')
}
