import React from "react";
import AcUnitIcon from "@mui/icons-material/AcUnit";
import WbSunnyIcon from "@mui/icons-material/WbSunny";
import ThunderstormIcon from "@mui/icons-material/Thunderstorm";
import data from "../data/data.json";

// Pre-index all places from data/data.json once at startup for 60fps search performance
let cachedPlaces = null;

export const getAllDataJsonPlaces = () => {
  if (cachedPlaces) return cachedPlaces;

  const allPlaces = [];
  if (data && data.states && Array.isArray(data.states)) {
    data.states.forEach((state) => {
      if (state.districts && Array.isArray(state.districts)) {
        state.districts.forEach((district) => {
          if (district.places && Array.isArray(district.places)) {
            district.places.forEach((place) => {
              allPlaces.push({
                ...place,
                state: state.name,
                district: district.name,
                city: district.name,
                location: `${district.name}, ${state.name}`,
              });
            });
          }
        });
      }
    });
  }
  cachedPlaces = allPlaces;
  return cachedPlaces;
};

// Helper function to derive current season and month name
export const getCurrentSeasonMeta = () => {
  const date = new Date();
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const month = monthNames[date.getMonth()];
  const monthIdx = date.getMonth();

  let season = "Winter";
  let icon = <AcUnitIcon sx={{ fontSize: 18, color: "#38bdf8" }} />;

  if (monthIdx >= 2 && monthIdx <= 5) {
    season = "Summer";
    icon = <WbSunnyIcon sx={{ fontSize: 18, color: "#f59e0b" }} />;
  } else if (monthIdx >= 6 && monthIdx <= 8) {
    season = "Monsoon";
    icon = <ThunderstormIcon sx={{ fontSize: 18, color: "#06b6d4" }} />;
  } else if (monthIdx >= 9 && monthIdx <= 10) {
    season = "Autumn";
    icon = <WbSunnyIcon sx={{ fontSize: 18, color: "#eab308" }} />;
  }

  return { month, season, icon };
};

export const getHistoryMeta = (text) => {
  const lower = (text || "").toLowerCase();

  if (lower.includes("@")) {
    return { type: "user", icon: "👤", color: "#6366f1" };
  }

  if (
    lower.includes("trip") ||
    lower.includes("tour") ||
    lower.includes("journey")
  ) {
    return { type: "trip", icon: "🧳", color: "#22c55e" };
  }

  if (
    lower.includes("jaipur") ||
    lower.includes("goa") ||
    lower.includes("delhi") ||
    lower.includes("beach") ||
    lower.includes("mountain")
  ) {
    return { type: "place", icon: "📍", color: "#f97316" };
  }

  return { type: "search", icon: "🔍", color: "#64748b" };
};

// Curated Unsplash image dictionary for popular travel destinations
const CURATED_UNSPLASH_MAP = {
  goa: [
    "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1518684079-3c830dcef090?auto=format&fit=crop&w=800&q=80",
  ],
  jaipur: [
    "https://images.unsplash.com/photo-1599661046827-dacff0c0f09a?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1477587458883-47145ed94245?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1524492412937-b28074a5d7da?auto=format&fit=crop&w=800&q=80",
  ],
  manali: [
    "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80",
  ],
  kerala: [
    "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1593693397690-362cb9666fc2?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80",
  ],
  shimla: [
    "https://images.unsplash.com/photo-1588668214407-6ea9a6d8c272?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80",
  ],
  agra: [
    "https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1524492412937-b28074a5d7da?auto=format&fit=crop&w=800&q=80",
  ],
  ladakh: [
    "https://images.unsplash.com/photo-1581793745862-99fde7fa73d2?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80",
  ],
  beach: [
    "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1518684079-3c830dcef090?auto=format&fit=crop&w=800&q=80",
  ],
  mountain: [
    "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1503220317375-aaad61436b1b?auto=format&fit=crop&w=800&q=80",
  ],
};

const DEFAULT_TRAVEL_IMAGES = [
  "https://images.unsplash.com/photo-1476514525535-ce74f4581a8f?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1503220317375-aaad61436b1b?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1500835556837-99ac94a94552?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1499856871958-5b9627545d1a?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1526772662000-3f88f10405ff?auto=format&fit=crop&w=800&q=80",
];

// Fills any place or trip item with multiple high-res Unsplash travel images
export const getUnsplashTravelImages = (item, count = 3) => {
  const existing = [];
  if (Array.isArray(item?.images)) {
    existing.push(...item.images.filter(Boolean));
  }
  if (item?.image) existing.push(item.image);
  if (item?.photoURL) existing.push(item.photoURL);

  const unique = Array.from(new Set(existing));
  if (unique.length >= count) return unique.slice(0, count);

  const queryText = (item?.name || item?.place || item?.to || item?.location || item?.title || "").toLowerCase();
  
  let matchingUnsplash = [];
  for (const [key, imgs] of Object.entries(CURATED_UNSPLASH_MAP)) {
    if (queryText.includes(key)) {
      matchingUnsplash.push(...imgs);
    }
  }

  const pool = matchingUnsplash.length > 0 ? matchingUnsplash : DEFAULT_TRAVEL_IMAGES;
  
  pool.forEach((img) => {
    if (!unique.includes(img) && unique.length < count) {
      unique.push(img);
    }
  });

  // Fallback to source.unsplash URL if needed
  while (unique.length < count) {
    const term = encodeURIComponent(queryText || "travel");
    unique.push(`https://source.unsplash.com/featured/800x600/?${term},${unique.length}`);
  }

  return unique.slice(0, count);
};

// Retrieve nearest suggested places based on city/district/state
export const getNearestSuggestedPlaces = (target, count = 3) => {
  const allPlaces = getAllDataJsonPlaces();
  if (!allPlaces.length || !target) return [];

  const targetName = (target.name || target.place || "").toLowerCase();
  const targetLoc = (target.location || target.city || target.state || target.to || "").toLowerCase();

  const nearest = allPlaces.filter((p) => {
    const pName = (p.name || "").toLowerCase();
    if (pName === targetName) return false;

    const pLoc = `${p.city || ""} ${p.district || ""} ${p.state || ""}`.toLowerCase();
    return targetLoc.includes(p.city?.toLowerCase()) || targetLoc.includes(p.state?.toLowerCase()) || pLoc.includes(targetLoc);
  });

  if (nearest.length >= count) return nearest.slice(0, count);

  // Fill with random other places if nearest matches are fewer
  const fallbacks = allPlaces.filter(p => (p.name || "").toLowerCase() !== targetName && !nearest.includes(p));
  return [...nearest, ...fallbacks].slice(0, count);
};

// Retrieve curated featured places
export const getFeaturedPlaces = (count = 4) => {
  const allPlaces = getAllDataJsonPlaces();
  if (!allPlaces.length) return [];
  return allPlaces.slice(0, count);
};

// Default fallback recommendations pulling from pre-indexed data/data.json
export const getFallbackSuggestions = (location, season) => {
  const allPlaces = getAllDataJsonPlaces();
  if (!allPlaces.length) return [];

  const seasonLower = (season || "").toLowerCase();

  const matchingSeason = allPlaces.filter((p) => {
    const s = (p.season || "").toLowerCase();
    const b = (p.bestTimeToVisit || "").toLowerCase();
    return s.includes(seasonLower) || b.includes(seasonLower);
  });

  const selectedPlaces = matchingSeason.length >= 3 ? matchingSeason.slice(0, 4) : allPlaces.slice(0, 4);

  return selectedPlaces.map((p) => ({
    place: p.name,
    tagline: `${p.type || "Attraction"} in ${p.city}, ${p.state} — ${p.description ? p.description.slice(0, 75) + "..." : "Popular place to visit"}`,
    category: p.type || "Must Visit",
    query: p.name,
    image: p.images?.[0] || "",
    dataJsonItem: p,
  }));
};

