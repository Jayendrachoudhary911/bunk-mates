import OpenAI from "openai";
import { fetchTripsFromFirestore } from "./firestore";

const client = new OpenAI({
  apiKey: `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`,
  baseURL: "https://api.groq.com/openai/v1",
  dangerouslyAllowBrowser: true,
});

export const askTravelAI = async ({
  message,
  user,
  history = [],
  summary = "",
  preferences = {},
  onChunk,
}) => {
  try {
    // 🔥 FETCH USER TRIPS
    const rawTrips = await fetchTripsFromFirestore(user?.uid);

    // 🔥 OPTIMIZE TRIPS (reduce tokens)
    const trips = rawTrips.map((t) => ({
      name: t.name,
      route: `${t.from} → ${t.to}`,
      dates: `${t.startDate} - ${t.endDate}`,
      members: t.members,
    }));

    const systemPrompt = `
You are BunkMates AI.

User: ${user?.displayName || "Traveler"}

Preferences:
${JSON.stringify(preferences)}

Conversation Summary:
${summary}

User Trips:
${trips.length ? JSON.stringify(trips) : "No trips available"}

Rules:
- Use trips data when relevant
- Personalize answers using preferences
- Respond ONLY in JSON
- Types: trip, budget, text

If user asks about existing trips → use "User Trips"
If user asks to create → generate new trip
`;

    const messages = [
      { role: "system", content: systemPrompt },

      ...history.map((m) => ({
        role: m.type === "user" ? "user" : "assistant",
        content: m.text,
      })),

      { role: "user", content: message },
    ];

    const stream = await client.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages,
      stream: true,
    });

    let full = "";

    for await (const chunk of stream) {
      const text = chunk.choices?.[0]?.delta?.content || "";
      full += text;
      if (onChunk && text) onChunk(text);
    }

    const clean = full.replace(/```json|```/g, "").trim();

    try {
      return JSON.parse(clean);
    } catch {
      return { type: "text", content: clean, data: {} };
    }
  } catch (err) {
    console.error("AI Error:", err);
    return {
      type: "text",
      content: "⚠️ AI failed.",
      data: {},
    };
  }
};

export const extractPreferences = async ({ message }) => {
  try {
    const res = await client.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        {
          role: "system",
          content: "Extract structured travel preferences as JSON only.",
        },
        {
          role: "user",
          content: message,
        },
      ],
    });

    const text = res.choices[0].message.content;

    try {
      return JSON.parse(text);
    } catch {
      return {};
    }
  } catch {
    return {};
  }
};