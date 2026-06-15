# Firebase Live Loop Verification

## Prerequisites
- Firebase project `hindtruck` is active and Firestore is enabled
- Firebase Authentication has the **Phone** sign-in provider enabled
  (Console → Authentication → Sign-in method → Phone → Enable)
- For local demos without real SMS, add a **test phone number** under
  Phone provider → "Phone numbers for testing", e.g. `+91 99999 99999` → code
  `123456`, and set `VITE_FIREBASE_AUTH_TEST_MODE=true` in the app's `.env`
  (disables reCAPTCHA so test numbers work on localhost). `localhost` is an
  authorized domain by default. **Never** set this flag in production.
- Real SMS at scale additionally needs the Blaze plan + App Check; flip
  `VITE_FIREBASE_AUTH_TEST_MODE` off and use real numbers — no code change.
- Both `.env` files have the correct `VITE_FIREBASE_*` values
- `npm install` has been run at the repo root

## Step 1: Start the Driver App (Firebase Mode)

The driver app needs `VITE_API_MODE=firebase` to use Firestore for loads/trip.

Option A — Modify `.env` temporarily:
```bash
# In the root .env, change VITE_API_MODE to firebase
# After testing, change it back to mock
```

Option B — Use a separate env file:
```bash
# Copy .env.firebase alongside .env and merge, or set the env var inline:
VITE_API_MODE=firebase npm run dev
```

Then start the driver dev server:
```bash
npm run dev
# Driver runs on http://localhost:5173 (default)
```

## Step 2: Start the Customer App (Firebase Mode)

The customer `.env` already has `VITE_API_MODE=firebase`.

```bash
npm -w @hindtrucks/customer run dev
# Customer runs on http://localhost:5174 (default) or configured port
```

If you need a different port to avoid conflict with the driver:
```bash
npm -w @hindtrucks/customer run dev -- --port 5180
```

## Step 3: Test the Booking Loop

### 3a. Customer posts a booking
1. Open the customer app in browser
2. Log in with any phone number + any 6-digit OTP (demo mode)
3. Go to "New Booking" screen
4. Fill in booking details (from/to city, goods, weight, etc.)
5. Submit the booking
6. Verify the booking appears in "My Bookings" with status "available" / "pending"

### 3b. Driver sees the booking
1. Open the driver app in a separate browser window
2. Log in with any phone number + any 6-digit OTP (demo mode)
3. Go to "Loads" screen
4. Verify the customer's booking appears in the available loads list
5. The load should show the same from/to cities, goods type, price as the customer entered

### 3c. Driver accepts the load
1. Tap/click on the load to see details
2. Tap "Accept Load"
3. Verify the load moves to "Active Trip" with step 1 (arrived at pickup)

### 3d. Customer sees "driver assigned"
1. In the customer app, go back to "My Bookings"
2. Verify the booking status has changed from "available" to "accepted"
3. The booking should now show driver info (name, phone, truck reg, rating)

### 3e. Customer tracks the truck
1. Tap on the booking to see details
2. Go to "Track Shipment" screen
3. Verify the tracking screen shows:
   - Driver info
   - Trip step indicator
   - Map (position may be null until driver advances steps)

### 3f. Driver advances trip steps
1. In the driver app, on the Active Trip screen
2. Tap "Advance" to move through steps: pickup → loaded → in-transit → delivered
3. Each step update writes to Firestore

### 3g. Customer sees progress updates
1. In the customer app, refresh/revisit the Track Shipment screen
2. Verify the step indicator updates to match the driver's progress

## Troubleshooting

- **Loads not appearing in driver app**: Check Firestore console — the `loads` collection should have docs with `status: "available"`
- **Booking status not updating**: Check that the driver's `acceptLoad` wrote `status: "accepted"` and `driverUid` to the Firestore doc
- **Firebase config errors**: Verify both `.env` files have all 6 `VITE_FIREBASE_*` values matching the Firebase project config
- **Firestore permission denied**: The deployed rules validate the `loads` document shape and allowed status transitions. If expected booking-loop writes are denied, check `firestore.rules` and run `firebase deploy --only firestore:rules`.
- **Port conflicts**: Driver default is 5173, customer default is 5174. Use `--port` flag if needed.

## Architecture Notes

- **Identity**: Firebase **Phone Auth** verifies the number (`signInWithPhoneNumber` + invisible reCAPTCHA + OTP `confirm`); the resulting non-anonymous `uid` is used in `shipperUid`/`driverUid`. The 10-digit number is still kept as display/profile/registration state. Firestore rules enforce creates/updates against `request.auth.uid`. Local demos verify against Console test numbers (see Prerequisites).
- **Firestore collection**: Single top-level `loads` collection. Doc fields include all `Load` fields + `status`, `shipperUid`, `driverUid`, `driver` (DriverInfo|null), `createdAt` (serverTimestamp), `step` (0..4), `position` (TruckPosition|null).
- **Service modes**: Both apps support 3 modes via `VITE_API_MODE`: `mock` (default, local data), `real` (API stubs), `firebase` (Firestore). In firebase mode, only loads/trip/booking/tracking use Firestore; auth/profile/earnings/chat stay on mock/local implementations.
