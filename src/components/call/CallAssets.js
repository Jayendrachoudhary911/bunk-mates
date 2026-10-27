// Default assets matching the Figma call screen designs
export const DEFAULT_CALLER_AVATAR = "/assets/images/call/boy.jpg";
export const DEFAULT_CALLER_NAME = "Jayendra choudhary";
export const DEFAULT_STREET_BG = "/assets/images/call/street_bg.jpg";

export const DEFAULT_GROUP_MEMBERS = [
  {
    id: "mem_saini",
    name: "Saini",
    username: "saini",
    photoURL: "/assets/images/call/cat.jpg",
    color: "#4ade80",
    isSpeaking: true,
  },
  {
    id: "mem_deepesh",
    name: "Deepesh",
    username: "deepesh",
    photoURL: "/assets/images/call/luffy.jpg",
    color: "#f87171",
    isSpeaking: false,
  },
  {
    id: "mem_bunk",
    name: "Bunk",
    username: "bunk1",
    photoURL: "/assets/images/call/yellow.jpg",
    color: "#facc15",
    isSpeaking: false,
  },
  {
    id: "mem_jayendra",
    name: "Jayendra",
    username: "jayendra",
    photoURL: "/assets/images/call/boy.jpg",
    color: "#38bdf8",
    isSpeaking: true,
    isMe: true,
  },
];

export function resolveAvatar(url, fallback = DEFAULT_CALLER_AVATAR) {
  if (typeof url === "string" && url.trim().length > 0) {
    return url;
  }
  return fallback;
}

export function resolveGroupMembers(members = [], currentUser) {
  if (Array.isArray(members) && members.length >= 2) {
    // Fill up to 4 if needed
    const mapped = members.map((m, idx) => ({
      id: m.uid || m.id || `mem_${idx}`,
      name: m.name || m.displayName || m.username || `Member ${idx + 1}`,
      username: m.username || "",
      photoURL: resolveAvatar(m.photoURL || m.avatar, DEFAULT_GROUP_MEMBERS[idx % DEFAULT_GROUP_MEMBERS.length].photoURL),
      color: DEFAULT_GROUP_MEMBERS[idx % DEFAULT_GROUP_MEMBERS.length].color,
      isSpeaking: idx === 0 || idx === 3,
      isMe: m.uid === currentUser?.uid || m.id === currentUser?.uid,
    }));
    if (mapped.length < 4) {
      const extra = DEFAULT_GROUP_MEMBERS.slice(mapped.length);
      return [...mapped, ...extra];
    }
    return mapped;
  }
  return DEFAULT_GROUP_MEMBERS;
}
