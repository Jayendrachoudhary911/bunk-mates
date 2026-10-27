// src/utils/chatHelpers.js
import OpenAI from "openai";

const groqClient = new OpenAI({
  apiKey: `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`,
  baseURL: "https://api.groq.com/openai/v1",
  dangerouslyAllowBrowser: true,
});

/**
 * Helper to convert Firestore timestamp / Date / string into seconds
 */
export const getMessageSeconds = (ts) => {
  if (!ts) return Date.now() / 1000;
  if (typeof ts.seconds === "number") return ts.seconds;
  if (typeof ts.toMillis === "function") return ts.toMillis() / 1000;
  if (ts._seconds) return ts._seconds;
  const d = new Date(ts).getTime();
  return isNaN(d) ? Date.now() / 1000 : d / 1000;
};

/**
 * Group images sent together or within 2 minutes range (120 seconds) with no messages in between.
 */
export const processMessagesWithImageGroups = (messages) => {
  if (!Array.isArray(messages) || messages.length === 0) return [];

  const result = [];
  let i = 0;

  const extractImages = (m) => {
    if (Array.isArray(m.images) && m.images.length > 0) return m.images.filter(Boolean);
    if (Array.isArray(m.imageUrls) && m.imageUrls.length > 0) return m.imageUrls.filter(Boolean);
    if (m.imageUrl) return [m.imageUrl];
    if (m.dataUri) return [m.dataUri];
    return [];
  };

  while (i < messages.length) {
    const msg = messages[i];
    const initialImages = extractImages(msg);
    // Is image-only if it has images and no substantial text/structured card
    const isImageOnly = initialImages.length > 0 && !msg.cardData && (!msg.text || !msg.text.trim());

    if (isImageOnly) {
      const combinedImages = [...initialImages];
      const combinedIds = [msg.id];
      let j = i + 1;
      let lastTime = getMessageSeconds(msg.timestamp);

      while (j < messages.length) {
        const nextMsg = messages[j];
        const nextImages = extractImages(nextMsg);
        const nextIsImageOnly = nextImages.length > 0 && !nextMsg.cardData && (!nextMsg.text || !nextMsg.text.trim());
        const nextTime = getMessageSeconds(nextMsg.timestamp);

        // Same sender, image-only, within 2 minutes (120s)
        if (
          nextMsg.senderId === msg.senderId &&
          nextIsImageOnly &&
          Math.abs(nextTime - lastTime) <= 120
        ) {
          combinedImages.push(...nextImages);
          combinedIds.push(nextMsg.id);
          lastTime = nextTime;
          j++;
        } else {
          break;
        }
      }

      if (combinedImages.length > 1) {
        result.push({
          ...msg,
          id: msg.id,
          type: "image_group",
          images: Array.from(new Set(combinedImages)),
          isGroupedImages: true,
          groupedMessageIds: combinedIds,
        });
        i = j;
        continue;
      }
    }

    result.push(msg);
    i++;
  }

  return result;
};

/**
 * URL and link preview extractor
 */
export const extractUrls = (text) => {
  if (!text || typeof text !== "string") return [];
  const urlRegex = /(https?:\/\/[^\s]+)/gi;
  return text.match(urlRegex) || [];
};

export const parseUrlMetadata = (urlStr) => {
  try {
    const url = new URL(urlStr);
    const hostname = url.hostname.replace(/^www\./, "");
    const pathname = url.pathname;

    let title = hostname;
    let type = "website";
    let thumbnail = null;

    // YouTube detection
    if (hostname.includes("youtube.com") || hostname.includes("youtu.be")) {
      type = "youtube";
      title = "YouTube Video";
      let videoId = "";
      if (hostname.includes("youtu.be")) {
        videoId = pathname.slice(1);
      } else {
        videoId = url.searchParams.get("v") || "";
      }
      if (videoId) {
        thumbnail = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
      }
    } else if (hostname.includes("maps.google") || hostname.includes("goo.gl/maps")) {
      type = "maps";
      title = "Google Maps Location";
    } else if (hostname.includes("spotify.com")) {
      type = "spotify";
      title = "Spotify Music";
    } else if (hostname.includes("github.com")) {
      type = "github";
      title = pathname.length > 1 ? `GitHub: ${pathname.slice(1)}` : "GitHub";
    }

    return {
      url: urlStr,
      hostname,
      title,
      type,
      thumbnail,
      favicon: `https://www.google.com/s2/favicons?domain=${hostname}&sz=64`,
    };
  } catch {
    return null;
  }
};

/**
 * Detect if a text message contains ONLY emojis (1 or more emojis, no regular alphanumeric text)
 */
export const isEmojiOnly = (text) => {
  if (!text || typeof text !== "string") return false;
  const trimmed = text.trim();
  if (!trimmed) return false;
  // Remove all Unicode extended pictographs, emoji components, variation selectors, ZWJ, and whitespace
  const nonEmoji = trimmed.replace(
    /[\p{Extended_Pictographic}\p{Emoji_Component}\uFE0F\u200D\s]/gu,
    ""
  );
  return nonEmoji.length === 0;
};

/**
 * AI Places & Itinerary Suggestions using Groq with openai/gpt-oss-120b
 */
export const generatePlaceSuggestions = async (query) => {
  try {
    const response = await groqClient.chat.completions.create({
      model: "openai/gpt-oss-120b",
      messages: [
        {
          role: "system",
          content: `You are BunkMates AI Travel Concierge. The user wants place suggestions or ideas for a trip.
Return a structured, clean response with:
- 3 top recommendations (spots, activities, food)
- Short 1-line reason for each with relevant emojis
- A quick local tip.
Keep total length under 100 words. Format with clean bullet points.`,
        },
        {
          role: "user",
          content: `Suggest top places, activities, or recommendations for: "${query}"`,
        },
      ],
      max_tokens: 300,
      temperature: 0.7,
    });

    return response.choices[0]?.message?.content?.trim() || "No recommendations found.";
  } catch (err) {
    console.warn("Retrying with llama-3.1-8b-instant fallback...", err?.message);
    try {
      const fb = await groqClient.chat.completions.create({
        model: "llama-3.1-8b-instant",
        messages: [
          {
            role: "system",
            content: `You are BunkMates AI Travel Concierge. Keep under 100 words with top recommendations and emojis.`,
          },
          {
            role: "user",
            content: `Suggest top places, activities, or recommendations for: "${query}"`,
          },
        ],
        max_tokens: 280,
      });
      return fb.choices[0]?.message?.content?.trim();
    } catch {
      return `✨ Top spots for ${query}:\n📍 1. Popular Heritage & City Centre\n☕ 2. Top Local Cuisine & Cafés\n🌅 3. Scenic Sunset Viewpoint\n💡 Tip: Visit early morning to avoid rush!`;
    }
  }
};

/**
 * Quick Travel Assistant AI using Groq with openai/gpt-oss-120b
 */
export const askQuickAI = async (prompt) => {
  try {
    const response = await groqClient.chat.completions.create({
      model: "openai/gpt-oss-120b",
      messages: [
        {
          role: "system",
          content: `You are BunkMates AI Assistant inside group chat. Answer the question directly, concisely and helpfully in under 80 words. Use emojis.`,
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      max_tokens: 240,
      temperature: 0.6,
    });

    return response.choices[0]?.message?.content?.trim() || "I couldn't process that.";
  } catch (err) {
    console.warn("Retrying askQuickAI with fallback...", err?.message);
    try {
      const fb = await groqClient.chat.completions.create({
        model: "llama-3.1-8b-instant",
        messages: [
          {
            role: "system",
            content: `You are BunkMates AI Assistant. Answer in under 80 words with emojis.`,
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        max_tokens: 220,
      });
      return fb.choices[0]?.message?.content?.trim();
    } catch {
      return "AI Assistant is currently unavailable. Please try again shortly.";
    }
  }
};

/**
 * Format any message (widgets, media, calls, polls, etc.) into a friendly snippet for chat lists
 */
export const formatMessageSnippet = (data) => {
  if (!data) return "No messages yet";

  // If passed a plain string
  if (typeof data === "string") return data || "No messages yet";

  // 1. System messages
  if (data.system || data.type === "system") {
    return data.content || data.text || "System message";
  }

  // 2. Call logs
  if (data.type === "call" || data.type === "call_log") {
    const isVideo = data.callType === "video" || data.isVideo;
    const icon = isVideo ? "📹" : "📞";
    const status = data.callStatus || data.status;
    if (status === "missed") return `${icon} Missed call`;
    if (status === "declined") return `${icon} Declined call`;
    return `${icon} ${isVideo ? "Video call" : "Voice call"}`;
  }

  // 3. Trip preview widget
  if (
    data.type === "trip_preview" ||
    data.type === "trip" ||
    data.cardData?.type === "trip_preview" ||
    data.cardData?.tripId
  ) {
    const title = data.cardData?.title || data.cardData?.destination || data.text;
    return `✈️ Trip: ${title || "Shared Trip"}`;
  }

  // 4. Place preview widget
  if (
    data.type === "place_preview" ||
    data.type === "place" ||
    data.cardData?.type === "place_preview" ||
    data.cardData?.placeId
  ) {
    const title = data.cardData?.title || data.cardData?.location || data.text;
    return `📍 Place: ${title || "Shared Place"}`;
  }

  // 5. User Profile preview widget
  if (
    data.type === "user_profile" ||
    data.type === "profile" ||
    data.cardData?.type === "user_profile" ||
    data.cardData?.uid
  ) {
    const name = data.cardData?.name || (data.cardData?.username ? `@${data.cardData.username}` : "Contact");
    return `👤 Contact: ${name}`;
  }

  // 6. Note preview widget
  if (
    data.type === "note_preview" ||
    data.type === "note" ||
    data.cardData?.type === "note_preview" ||
    data.cardData?.noteId
  ) {
    const title = data.cardData?.title || data.text;
    return `📝 Note: ${title || "Trip Note"}`;
  }

  // 7. Checklist widget
  if (data.type === "checklist" || data.checklistData || data.cardData?.items) {
    const title = data.cardData?.title || data.text;
    return `☑️ Checklist: ${title || "Group Checklist"}`;
  }

  // 8. Poll widget
  if (data.type === "poll" || data.pollData || data.cardData?.options) {
    const question = data.cardData?.question || data.text;
    return `📊 Poll: ${question || "Group Poll"}`;
  }

  // 9. Timeline widget
  if (data.type === "timeline" || data.timelineData || data.cardData?.events) {
    const tripTitle = data.cardData?.tripTitle || data.text;
    return `📅 Timeline: ${tripTitle || "Trip Itinerary"}`;
  }

  // 10. Budget / Expense widget
  if (data.type === "budget" || data.type === "expense" || data.type === "budget_preview") {
    const label = data.type === "budget" ? "Budget" : "Expense";
    const title = data.cardData?.title || data.cardData?.category || data.text;
    return `💰 ${label}: ${title || "Shared Expense"}`;
  }

  // 11. Photos / Images
  const hasImage = Boolean(
    data.type === "image" ||
    data.imageUrl ||
    data.mediaUrl ||
    data.dataUri ||
    (Array.isArray(data.images) && data.images.length > 0) ||
    (Array.isArray(data.media) && data.media.length > 0)
  );
  if (hasImage) {
    if (data.text && typeof data.text === "string" && data.text.trim()) {
      return `📷 ${data.text.trim()}`;
    }
    const count = Array.isArray(data.images)
      ? data.images.length
      : Array.isArray(data.media)
      ? data.media.length
      : 1;
    return count > 1 ? `📷 ${count} Photos` : "📷 Photo";
  }

  // 12. Audio / Voice note
  if (data.type === "audio" || data.audioUrl) {
    return "🎤 Voice message";
  }

  // 13. Video
  if (data.type === "video" || data.videoUrl) {
    return data.text?.trim() ? `🎥 ${data.text.trim()}` : "🎥 Video";
  }

  // 14. Document / File
  if (data.type === "file" || data.fileUrl) {
    return `📎 ${data.fileName || "Attachment"}`;
  }

  // 15. Regular Text
  if (data.text && typeof data.text === "string" && data.text.trim()) {
    return data.text.trim();
  }

  // 16. Fallback
  return data.content || "No messages yet";
};

/**
 * Safely convert any timestamp format (Firestore Timestamp, seconds, millis, ISO string, Date) into a JS Date
 */
export const getTimestampDate = (ts) => {
  if (!ts) return new Date();
  if (ts instanceof Date) return ts;
  if (typeof ts.toDate === "function") return ts.toDate();
  if (typeof ts.toMillis === "function") return new Date(ts.toMillis());
  if (typeof ts.seconds === "number") return new Date(ts.seconds * 1000);
  if (typeof ts._seconds === "number") return new Date(ts._seconds * 1000);
  if (typeof ts === "number") {
    return ts < 10000000000 ? new Date(ts * 1000) : new Date(ts);
  }
  if (typeof ts === "string") {
    const d = new Date(ts);
    return isNaN(d.getTime()) ? new Date() : d;
  }
  return new Date();
};

/**
 * Determine if two message timestamps belong to different calendar days
 */
export const isDifferentDay = (tsA, tsB) => {
  const dA = getTimestampDate(tsA);
  const dB = getTimestampDate(tsB);
  return (
    dA.getFullYear() !== dB.getFullYear() ||
    dA.getMonth() !== dB.getMonth() ||
    dA.getDate() !== dB.getDate()
  );
};

/**
 * Format a timestamp into a human-friendly date section label
 * e.g., "Today", "Yesterday", "Monday, Oct 24", "Oct 24, 2025"
 */
export const getMessageDateLabel = (ts) => {
  if (!ts) return "Today";
  const date = getTimestampDate(ts);
  if (isNaN(date.getTime())) return "Today";

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const msgDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffTime = today.getTime() - msgDay.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays > 1 && diffDays < 7) {
    return date.toLocaleDateString(undefined, { weekday: "long" });
  }
  if (date.getFullYear() === now.getFullYear()) {
    return date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });
  }
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

