type DistanceUnit = 'K' | 'N' | 'M'; // Kilometers, Nautical Miles, Miles

const measureDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
  unit: DistanceUnit,
  incrementInRangeCounter: () => void
): number => {
  const earthRadiusKm = 6371; // Earth's radius in kilometers
  const degToRad = Math.PI / 180; // Conversion factor from degrees to radians

  const dLat = (lat2 - lat1) * degToRad;
  const dLon = (lon2 - lon1) * degToRad;
  const lat1Rad = lat1 * degToRad;
  const lat2Rad = lat2 * degToRad;

  const a =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1Rad) * Math.cos(lat2Rad) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  let distance = earthRadiusKm * c; // Initial distance in kilometers

  switch (unit) {
    case 'N':
      distance /= 1.852; // Convert distance to nautical miles
      break;
    case 'M':
      distance *= 0.621371; // Convert distance to miles
      break;
    case 'K':
      // Distance remains in kilometers
      break;
  }

  if (distance <= 500) {
    incrementInRangeCounter();
  }

  return distance;
};

export default measureDistance;
