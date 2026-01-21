// Haversine distance (km)
export const getDistanceKm = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;

  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

// Simple, explainable AI score
export const computeAIScore = ({ place, user, distanceKm }) => {
  let score = 0;

  if (user?.likedTrips?.includes(place.id)) score += 3;
  if (place.likesCount) score += Math.min(place.likesCount / 200, 1);

  if (distanceKm !== null && distanceKm !== undefined) {
    score += Math.max(0, 1 - distanceKm / 500);
  }

  return score;
};

export const isTrending = (place) => (place.likesCount || 0) >= 100;

// Main sorter
export const sortPlacesForUser = ({ places, user, userLocation }) => {
  return [...places]
    .map((place) => {
      const distanceKm =
        userLocation && place.lat && place.lon
          ? getDistanceKm(
              userLocation.lat,
              userLocation.lon,
              place.lat,
              place.lon
            )
          : null;

      return {
        ...place,
        distanceKm,
        aiScore: computeAIScore({ place, user, distanceKm }),
      };
    })
    .sort((a, b) => b.aiScore - a.aiScore);
};
