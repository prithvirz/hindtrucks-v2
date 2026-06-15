/**
 * De-duplicate seeded `loads` documents in the `hindtruck` Firestore project.
 *
 * The mock seed was run more than once, leaving identical "available" loads in
 * the collection. This script groups loads by their seed identity and keeps the
 * single oldest doc per group, deleting the rest.
 *
 * SAFETY:
 *   - Only considers loads with status === 'available' AND no driverUid.
 *     Accepted / in-transit / completed / cancelled and driver-assigned loads
 *     are never touched.
 *   - Dry-run by default. Pass --apply to actually delete.
 *
 * AUTH (admin — bypasses Firestore rules, which forbid client deletes):
 *   Either
 *     gcloud auth application-default login   # then run with no key
 *   or
 *     export GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json
 *
 * RUN:
 *   node scripts/dedupe-loads.mjs           # dry-run, lists what would be deleted
 *   node scripts/dedupe-loads.mjs --apply   # performs the deletes
 *
 * Requires: npm i -D firebase-admin
 */
import { initializeApp, applicationDefault, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

const PROJECT_ID = 'hindtruck'
const APPLY = process.argv.includes('--apply')

const keyPath = process.env.GOOGLE_APPLICATION_CREDENTIALS
initializeApp({
  projectId: PROJECT_ID,
  credential: keyPath ? cert(keyPath) : applicationDefault(),
})

const db = getFirestore()

/** Seed identity — two available loads with the same key are duplicates. */
function seedKey(d) {
  return [
    d.fromCity,
    d.fromArea,
    d.toCity,
    d.toArea,
    d.goods,
    d.truckType,
    d.price,
    d.shipperName,
  ].join('|')
}

function createdMs(d) {
  return d.createdAt?.toMillis?.() ?? 0
}

const snap = await db.collection('loads').get()
const groups = new Map()

snap.forEach((doc) => {
  const d = doc.data()
  if (d.status !== 'available') return
  if (d.driverUid) return
  const key = seedKey(d)
  if (!groups.has(key)) groups.set(key, [])
  groups.get(key).push({ id: doc.id, createdMs: createdMs(d), summary: `${d.fromCity}→${d.toCity} ${d.goods} ₹${d.price}` })
})

const toDelete = []
for (const [, docs] of groups) {
  if (docs.length < 2) continue
  // Keep the oldest; delete the rest.
  docs.sort((a, b) => a.createdMs - b.createdMs)
  toDelete.push(...docs.slice(1))
}

console.log(`Scanned ${snap.size} loads. Duplicate groups: ${[...groups.values()].filter((g) => g.length > 1).length}.`)
console.log(`Would delete ${toDelete.length} duplicate doc(s):`)
toDelete.forEach((d) => console.log(`  - ${d.id}  (${d.summary})`))

if (!APPLY) {
  console.log('\nDry run. Re-run with --apply to delete.')
  process.exit(0)
}

let n = 0
for (const d of toDelete) {
  await db.collection('loads').doc(d.id).delete()
  n++
}
console.log(`\nDeleted ${n} duplicate load(s).`)
