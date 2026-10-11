import { getAllDataJsonPlaces, getFallbackSuggestions } from "../utils/searchHelpers";

const DEFAULT_GROQ_KEY = "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";

/**
 * Generates context-aware AI place suggestions using Groq AI and matches them against data.json places catalog.
 */
export async function fetchContextAiSuggestions(userGroqKey, userLocation, seasonMeta, searchHistory) {
  const keyToUse = userGroqKey || DEFAULT_GROQ_KEY;
  const historySnippet = searchHistory.length ? searchHistory.slice(0, 3).join(", ") : "general travel";

  const prompt = `You are a travel assistant for India.
User Location: ${userLocation}
Current Month & Season: ${seasonMeta.month} (${seasonMeta.season})
Recent Interests: ${historySnippet}

Suggest 4 specific travel destinations in India perfect for ${seasonMeta.month} from ${userLocation}.
Return ONLY a valid JSON array of objects with keys: "place", "tagline", "category", "query".
Example:
[
  {"place": "Manali", "tagline": "Snow peaks and cozy mountain adventures", "category": "Hill Station", "query": "Manali trip"}
]`;

  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${keyToUse}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.5,
      }),
    });

    const resData = await res.json();
    const content = resData?.choices?.[0]?.message?.content || "";
    const jsonMatch = content.match(/\[[\s\S]*\]/);

    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const catalog = getAllDataJsonPlaces();
        return parsed.map((item) => {
          const matchInCatalog = catalog.find(
            (p) => (p.name || "").toLowerCase() === (item.place || "").toLowerCase()
          );
          return {
            ...item,
            image: matchInCatalog?.images?.[0] || "",
            dataJsonItem: matchInCatalog || null,
          };
        });
      }
    }
  } catch (err) {
    console.error("Groq AI context suggestions failed:", err);
  }

  return getFallbackSuggestions(userLocation, seasonMeta.season);
}

/**
 * Generates custom AI trip recommendations for a search query using Groq AI.
 */
export async function fetchQueryAiTripRecommendations(userGroqKey, query, userLocation, seasonMeta) {
  const queryToUse = (query || "").trim();
  if (!queryToUse) return [];

  const keyToUse = userGroqKey || DEFAULT_GROQ_KEY;
  const prompt = `Create 3 custom travel trip recommendations for query "${queryToUse}" in India.
Origin/Context Location: ${userLocation}
Season: ${seasonMeta.season} (${seasonMeta.month})

Return strictly a valid JSON array of objects with keys:
"name", "from", "to", "durationDays", "budget", "description", "highlights".
Example:
[
  {
    "name": "Weekend Escape to Shimla",
    "from": "${userLocation}",
    "to": "Shimla",
    "durationDays": 3,
    "budget": 8500,
    "description": "Scenic mountain views and Mall Road strolls.",
    "highlights": ["Ridge view", "Kufri snow", "Cozy cafes"]
  }
]`;

  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${keyToUse}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.6,
      }),
    });

    const resData = await res.json();
    const content = resData?.choices?.[0]?.message?.content || "";
    const jsonMatch = content.match(/\[[\s\S]*\]/);

    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (err) {
    console.error("Groq AI trip recommendations failed:", err);
  }

  return [
    {
      name: `Explore ${queryToUse}`,
      from: userLocation,
      to: queryToUse,
      durationDays: 3,
      budget: 6500,
      description: `Recommended travel experience around ${queryToUse} for ${seasonMeta.month}.`,
      highlights: ["Local sightseeing", "Authentic cuisine", "Top attractions"],
    },
  ];
}

/**
 * Generates AI Guide insights for a specific place drawer view.
 */
export async function fetchPlaceAiGuide(userGroqKey, placeName, placeCity, fallbackItem) {
  const keyToUse = userGroqKey || DEFAULT_GROQ_KEY;
  const prompt = `Give travel guide insights for "${placeName}" in "${placeCity || 'India'}".
Return strictly raw JSON object without markdown code blocks:
{
  "bestTime": "October to March",
  "topAttractions": ["Attraction 1", "Attraction 2", "Attraction 3"],
  "recommendedDays": 3,
  "travelTip": "Essential tip for visitors."
}`;

  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${keyToUse}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.4,
      }),
    });

    const resData = await res.json();
    const content = resData?.choices?.[0]?.message?.content || "";
    const jsonMatch = content.match(/\{[\s\S]*\}/);

    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (err) {
    console.error("Groq AI place guide failed:", err);
  }

  return {
    bestTime: fallbackItem?.season || fallbackItem?.bestTimeToVisit || "October to March",
    topAttractions: fallbackItem?.nearestAttractions || [fallbackItem?.type || "Sightseeing", "Local Market", "Cultural Landmarks"],
    recommendedDays: 2,
    travelTip: `Ideal destination to visit in ${fallbackItem?.city || 'India'} during peak season.`,
  };
}

/**
 * Generates a smart 2-sentence AI Search Overview for committed search queries.
 */
export async function fetchSearchAiSummary(userGroqKey, searchTerm, userLocation, seasonMeta) {
  if (!searchTerm || !searchTerm.trim()) return null;

  const keyToUse = userGroqKey || DEFAULT_GROQ_KEY;
  const prompt = `Provide a smart 2-sentence AI search summary overview for query "${searchTerm}".
Context: Current User Location - ${userLocation}, Month - ${seasonMeta.month} (${seasonMeta.season}).
Highlight key insights across matching destinations, community members, notes, and trips. Return strictly raw text without markdown fences or code blocks.`;

  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${keyToUse}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.4,
      }),
    });

    const resData = await res.json();
    const content = resData?.choices?.[0]?.message?.content || "";
    return content.trim();
  } catch (err) {
    console.error("AI Summary generation failed:", err);
    return `Explore matching results for "${searchTerm}" in ${userLocation}. Discover top places, travel plans, notes, and community profiles.`;
  }
}
