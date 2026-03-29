import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(
  `AIzaSyDAtJmiCiMcMCt-VnZcqDwnsLhK6iaYC4w`
);

export const askTravelAI = async ({
  message,
  user,
  trips,
}) => {
  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash-latest",
    });

    // 🧠 Context Engineering (VERY IMPORTANT)
    const prompt = `
You are an intelligent travel assistant inside an app called BunkMate.

You help users with:
- Travel planning
- Trip suggestions
- Budget advice
- Packing lists
- Route guidance
- Their personal trips and account

USER INFO:
Name: ${user?.name || "Unknown"}
Email: ${user?.email || "N/A"}

USER TRIPS:
${JSON.stringify(trips, null, 2)}

INSTRUCTIONS:
- Answer like a smart assistant
- Be concise but helpful
- Use user's trip data when relevant
- If question is unrelated, still try to help

USER QUESTION:
${message}
`;

    const result = await model.generateContent(prompt);
    const response = result.response.text();

    return response;
  } catch (err) {
    console.error(err);
    return "Something went wrong. Please try again.";
  }
};