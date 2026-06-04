interface Props {
  className?: string
  size?: number
}

export default function AppLogo({ className, size = 44 }: Props) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ width: size, height: size }}
    >
      <defs>
        <linearGradient id="logoTruckGrad" x1="8" y1="20" x2="56" y2="44" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#F26A1B" /> {/* Vibrant orange */}
          <stop offset="100%" stopColor="#D94E06" /> {/* Deep amber-orange */}
        </linearGradient>
        <linearGradient id="logoRoadGrad" x1="12" y1="44" x2="52" y2="48" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#374151" />
          <stop offset="100%" stopColor="#111827" />
        </linearGradient>
      </defs>

      {/* Speed lines in the background */}
      <path d="M6 24H18" stroke="#F26A1B" strokeWidth="2.5" strokeLinecap="round" opacity="0.3" />
      <path d="M2 32H14" stroke="#F26A1B" strokeWidth="3.5" strokeLinecap="round" opacity="0.4" />
      <path d="M8 40H16" stroke="#F26A1B" strokeWidth="2.5" strokeLinecap="round" opacity="0.2" />

      {/* Road / Horizon under the truck */}
      <path d="M12 48C22 48 42 48 52 48C50 51 46 54 40 54H24C18 54 14 51 12 48Z" fill="url(#logoRoadGrad)" />
      <path d="M28 48L24 54" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
      <path d="M36 48L38 54" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />

      {/* Truck Trailer - solid bold black base */}
      <path d="M18 20C18 18.8954 18.8954 18 20 18H36C37.1046 18 38 18.8954 38 20V42H18V20Z" fill="#0B0B0F" />
      
      {/* Tricolor dynamic stripe on trailer (Orange, White, Green) representing Hind (India) */}
      <path d="M18 24H38V26.5H18V24Z" fill="#FF9F59" />
      <path d="M18 26.5H38V29H18V26.5Z" fill="#FFFFFF" />
      <path d="M18 29H38V31.5H18V29Z" fill="#16A34A" />

      {/* Truck Cabin / Front */}
      <path d="M39 22H48C49.6569 22 51 23.3431 51 25V33L56 37C56.63 37.5 57 38.25 57 39V42H39V22Z" fill="url(#logoTruckGrad)" />
      
      {/* Cabin Windshield / Window */}
      <path d="M43 24H47C47.8 24 48.5 24.5 48.8 25.2L51 30H43V24Z" fill="#FFFFFF" opacity="0.85" />

      {/* Wheel Hubs (Stylized dark tires with silver rims) */}
      {/* Rear Tires */}
      <circle cx="23" cy="46" r="4.5" fill="#0B0B0F" />
      <circle cx="23" cy="46" r="1.5" fill="#E5E7EB" />
      <circle cx="33" cy="46" r="4.5" fill="#0B0B0F" />
      <circle cx="33" cy="46" r="1.5" fill="#E5E7EB" />
      
      {/* Front Tire */}
      <circle cx="48" cy="46" r="4.5" fill="#0B0B0F" />
      <circle cx="48" cy="46" r="1.5" fill="#E5E7EB" />
    </svg>
  )
}
