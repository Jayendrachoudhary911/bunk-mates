export const computeAIScore = ({
  place,
  user,
  distanceKm,
  maxLikes = 1000,
}) => {
  let score = 0;

  // 1. Strong signal: user liked
  if (user?.likedTrips?.includes(place.id)) score += 3;

  // 2. Category similarity
  const likedCategories = user?.likedCategories || [];
  if (likedCategories.includes(place.category)) score += 2;

  // 3. Popularity normalization
  score += Math.min((place.likesCount || 0) / maxLikes, 1);

  // 4. Distance decay (closer = higher score)
  if (distanceKm !== null) {
    score += Math.max(0, 1 - distanceKm / 500); // 500km soft cap
  }

  return score;
};
