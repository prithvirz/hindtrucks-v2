// Central image + illustration assets. Photos are royalty-free Unsplash URLs
// (sized via query params). Swap any URL here to restyle the whole app.

const u = (id: string, w = 800) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=80`

export const images = {
  // Indian highways / trucks / logistics
  splashHighway: u('1601584115197-04ecc0da31d7', 1000),
  homeHero: u('1519003722824-194d4455a60c', 900),
  loadBoxes: u('1586528116311-ad8dd3c8310d', 600),
  loadWarehouse: u('1553413077-190dd305871c', 600),
  loadContainer: u('1494412574643-ff11b0a5c1c3', 600),
  loadParcel: u('1607344645866-009c320b63e0', 600),
  truckSide: u('1601584115197-04ecc0da31d7', 900),
  mapStatic: u('1524661135-423995f22d0b', 900),
  emptyLoads: u('1578575437130-527eed3abbec', 700),
  driverAvatar: u('1633332755192-727a05c4013d', 240),
}

// Map goods category -> representative image
export const goodsImage: Record<string, string> = {
  electronics: images.loadBoxes,
  furniture: images.loadWarehouse,
  containers: images.loadContainer,
  parcels: images.loadParcel,
  default: images.loadBoxes,
}
