// ---------- Color Safety Utils ----------

// Returns true ONLY for valid hex colors
const isHexColor = (v) =>
  typeof v === "string" && /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(v);

// Extracts first hex from gradient string (best heuristic)
const extractHexFromGradient = (gradient) => {
  if (typeof gradient !== "string") return null;
  const match = gradient.match(/#([0-9a-f]{6}|[0-9a-f]{3})/i);
  return match ? `#${match[1]}` : null;
};

const hexToRgb = (hex) => {
  if (!isHexColor(hex)) return null;

  let clean = hex.slice(1);
  if (clean.length === 3) {
    clean = clean.split("").map((c) => c + c).join("");
  }

  const num = parseInt(clean, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
};

const getLuminance = (hex) => {
  const rgb = hexToRgb(hex);
  if (!rgb) return null;

  const { r, g, b } = rgb;
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
};

// ---------- Public API ----------
export const getReadableTextColor = (background) => {
  // Animated gradient object
  if (typeof background === "object" && background?.value) {
    background = background.value;
  }

  // Gradient string → extract color
  if (typeof background === "string" && background.includes("gradient")) {
    const hex = extractHexFromGradient(background);
    if (!hex) return "#ffffff";
    const lum = getLuminance(hex);
    return lum > 0.55 ? "#000000" : "#ffffff";
  }

  // Solid hex
  if (isHexColor(background)) {
    const lum = getLuminance(background);
    return lum > 0.55 ? "#000000" : "#ffffff";
  }

  // Absolute safe fallback
  return "#ffffff";
};
