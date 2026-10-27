// src/components/chats_components/EmojiCommandPalette.jsx
import React, { useMemo } from "react";
import { Paper, Box, Typography, ButtonBase } from "@mui/material";
import { motion, AnimatePresence } from "framer-motion";

export const EMOJI_DATABASE = [
  // Reactions & Expressions
  { emoji: "😀", name: "grinning", keywords: ["smile", "happy", "grin", "face"] },
  { emoji: "😂", name: "joy", keywords: ["laugh", "tears", "lol", "lmao", "haha"] },
  { emoji: "🤣", name: "rofl", keywords: ["rolling", "floor", "laughing"] },
  { emoji: "😊", name: "blush", keywords: ["smile", "happy", "cute", "blush"] },
  { emoji: "😍", name: "heart_eyes", keywords: ["love", "crush", "heart", "eyes"] },
  { emoji: "🥰", name: "in_love", keywords: ["hearts", "love", "warm"] },
  { emoji: "😎", name: "sunglasses", keywords: ["cool", "chill", "swag", "sun"] },
  { emoji: "🤩", name: "star_struck", keywords: ["wow", "stars", "amazing"] },
  { emoji: "🥳", name: "partying", keywords: ["party", "celebration", "birthday"] },
  { emoji: "🤔", name: "thinking", keywords: ["hmm", "think", "wonder", "ponder"] },
  { emoji: "😭", name: "sob", keywords: ["cry", "sad", "tears", "bawling"] },
  { emoji: "🥺", name: "pleading", keywords: ["puppy", "please", "eyes"] },
  { emoji: "😱", name: "screaming", keywords: ["scared", "shocked", "omg"] },
  { emoji: "😴", name: "sleeping", keywords: ["tired", "sleep", "zzz"] },
  { emoji: "🔥", name: "fire", keywords: ["lit", "flame", "hot", "fire"] },
  { emoji: "❤️", name: "heart", keywords: ["love", "red", "like"] },
  { emoji: "💯", name: "100", keywords: ["perfect", "score", "hundred"] },
  { emoji: "✨", name: "sparkles", keywords: ["stars", "magic", "clean", "shine"] },
  { emoji: "🎉", name: "tada", keywords: ["party", "celebrate", "congrats"] },
  { emoji: "👏", name: "clap", keywords: ["applause", "bravo", "hands"] },
  { emoji: "👍", name: "thumbsup", keywords: ["yes", "like", "ok", "good", "+1"] },
  { emoji: "👎", name: "thumbsdown", keywords: ["no", "dislike", "-1"] },
  { emoji: "🙌", name: "raised_hands", keywords: ["hooray", "celebration", "hands"] },
  { emoji: "🙏", name: "pray", keywords: ["thanks", "please", "hope", "namaste"] },
  { emoji: "💪", name: "muscle", keywords: ["strong", "flex", "workout", "power"] },
  { emoji: "👋", name: "wave", keywords: ["hi", "hello", "bye", "goodbye"] },
  { emoji: "👀", name: "eyes", keywords: ["look", "see", "watch", "shifty"] },

  // Travel & Adventure
  { emoji: "✈️", name: "airplane", keywords: ["plane", "flight", "travel", "fly"] },
  { emoji: "🏖️", name: "beach", keywords: ["vacation", "sea", "summer", "ocean", "holiday"] },
  { emoji: "🏝️", name: "island", keywords: ["tropical", "paradise", "travel"] },
  { emoji: "⛺", name: "tent", keywords: ["camping", "nature", "outdoor", "trip"] },
  { emoji: "🗺️", name: "map", keywords: ["travel", "navigation", "trip", "direction"] },
  { emoji: "🎒", name: "backpack", keywords: ["bag", "travel", "hiking", "trip"] },
  { emoji: "🚗", name: "car", keywords: ["drive", "roadtrip", "auto"] },
  { emoji: "🚆", name: "train", keywords: ["railway", "trip", "metro"] },
  { emoji: "🚕", name: "taxi", keywords: ["cab", "uber", "transport"] },
  { emoji: "🚀", name: "rocket", keywords: ["launch", "fast", "space", "moon"] },
  { emoji: "📸", name: "camera", keywords: ["photo", "picture", "selfie"] },
  { emoji: "🏨", name: "hotel", keywords: ["stay", "room", "vacation"] },

  // Food & Drinks
  { emoji: "🍔", name: "burger", keywords: ["food", "fastfood", "dinner", "lunch"] },
  { emoji: "🍕", name: "pizza", keywords: ["food", "cheese", "slice", "dinner"] },
  { emoji: "🍟", name: "fries", keywords: ["food", "snack", "potato"] },
  { emoji: "🍻", name: "beers", keywords: ["cheers", "drink", "party", "pub"] },
  { emoji: "🥂", name: "champagne", keywords: ["toast", "celebration", "party"] },
  { emoji: "☕", name: "coffee", keywords: ["tea", "morning", "cafe", "cup"] },
  { emoji: "🍦", name: "icecream", keywords: ["sweet", "dessert", "cold"] },
  { emoji: "💰", name: "moneybag", keywords: ["cash", "budget", "rich", "payment"] },
  { emoji: "💵", name: "dollar", keywords: ["money", "currency", "bill"] },
  { emoji: "✅", name: "check", keywords: ["done", "yes", "correct", "checklist"] },
];

/**
 * Extracts emoji query from text.
 * Matches: `:query` at start or preceded by whitespace.
 */
export const getEmojiQuery = (text) => {
  if (!text || typeof text !== "string") return null;
  // Match trailing :word (e.g., ":fi" or "hello :fi" or just ":")
  const match = text.match(/(?:^|\s):([a-zA-Z0-9_+-]*)$/);
  if (!match) return null;
  return match[1].toLowerCase();
};

export const getFilteredEmojis = (input) => {
  const query = getEmojiQuery(input);
  if (query === null) return [];

  if (query === "") {
    // Return top 16 popular emojis when user just types ':'
    return EMOJI_DATABASE.slice(0, 16);
  }

  return EMOJI_DATABASE.filter(
    (item) =>
      item.name.toLowerCase().startsWith(query) ||
      item.keywords.some((k) => k.toLowerCase().startsWith(query))
  ).slice(0, 16);
};

const EmojiCommandPalette = ({
  input,
  onSelectEmoji,
  onSendDirectEmoji,
  isDark = true,
  selectedIndex = 0,
}) => {
  const query = useMemo(() => getEmojiQuery(input), [input]);
  const emojis = useMemo(() => getFilteredEmojis(input), [input]);

  const visible = query !== null && emojis.length > 0;

  if (!visible) return null;

  return (
    <AnimatePresence>
      <Box
        component={motion.div}
        initial={{ opacity: 0, y: 10, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 8, scale: 0.96 }}
        transition={{ duration: 0.16, ease: "easeOut" }}
        sx={{
          position: "absolute",
          bottom: "100%",
          left: 0,
          right: 0,
          mb: 1.2,
          zIndex: 999,
          px: { xs: 1, sm: 2 },
        }}
      >
<Paper
          elevation={0}
          sx={{
            p: 1.2,
            borderRadius: 10,
            bgcolor: isDark ? "rgba(20, 20, 20, 0.17)" : "rgba(255, 255, 255, 0.48)",
            border: `0px solid ${
              isDark ? "rgba(255, 255, 255, 0.12)" : "rgba(0, 0, 0, 0.08)"
            }`,
            boxShadow: "none",
            backdropFilter: 'blur(20px)',
            maxHeight: 280,
            overflowY: "auto",
            "&::-webkit-scrollbar": {
              width: "6px",
            },
            "&::-webkit-scrollbar-track": {
              background: "transparent",
            },
            "&::-webkit-scrollbar-thumb": {
              background: isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.15)",
              borderRadius: "4px",
            },
          }}
        >

          {/* Emojis Grid */}
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "repeat(4, 1fr)",
                sm: "repeat(8, 1fr)",
              },
              gap: 0.8,
            }}
          >
            {emojis.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <ButtonBase
                  key={item.name + idx}
                  onClick={() => {
                    if (onSendDirectEmoji) {
                      onSendDirectEmoji(item.emoji);
                    } else if (onSelectEmoji) {
                      onSelectEmoji(item.emoji);
                    }
                  }}
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    p: 0.8,
                    borderRadius: 8,
                    bgcolor: isSelected
                      ? isDark
                        ? "rgba(255, 255, 255, 0.12)"
                        : "rgba(0, 0, 0, 0.08)"
                      : isDark
                        ? "rgba(255, 255, 255, 0.035)"
                        : "rgba(0, 0, 0, 0.035)",
                    boxShadow: isSelected
                      ? isDark
                        ? "inset 0 1px 1px rgba(255, 255, 255, 0.16), inset 0 -1px 2px rgba(0,0,0,0.4)"
                        : "inset 0 1px 2px rgba(255, 255, 255, 0.6), inset 0 -1px 1px rgba(0,0,0,0.08)"
                      : isDark
                        ? "inset 0 1px 1px rgba(255, 255, 255, 0.06), inset 0 -1px 2px rgba(0,0,0,0.2)"
                        : "inset 0 1px 1px rgba(255, 255, 255, 0.5), inset 0 -1px 2px rgba(0,0,0,0.05)",
                    border: "0px solid",
                    transition: "all 180ms ease",
                    "&:hover": {
                      bgcolor: isDark
                        ? "rgba(255, 255, 255, 0.08)"
                        : "rgba(0, 0, 0, 0.07)",
                      boxShadow: "none",
                      transform: "scale(1.05)",
                    },
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: "1.6rem",
                      lineHeight: 1,
                      mb: 0.4,
                      filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.2))",
                    }}
                  >
                    {item.emoji}
                  </Typography>
                  <Typography
                    variant="caption"
                    noWrap
                    sx={{
                      fontSize: "0.62rem",
                      color: isDark ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.6)",
                      fontFamily: "monospace",
                      maxWidth: "100%",
                    }}
                  >
                    :{item.name}:
                  </Typography>
                </ButtonBase>
              );
            })}
          </Box>
        </Paper>
      </Box>
    </AnimatePresence>
  );
};

export default React.memo(EmojiCommandPalette);
