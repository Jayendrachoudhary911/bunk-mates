// ---------- Utilities ----------
export const hashString = (str = "") => {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(31, h) + str.charCodeAt(i) | 0;
  }
  return Math.abs(h);
};


// ---------- Luminance + Contrast ----------
export const getContrastText = (hex) => {
  if (!hex?.startsWith("#")) return "#ffffff";
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;

  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return luminance > 0.55 ? "#000000" : "#ffffff";
};

// ---------- SOLID PRESETS ----------
export const solidPresets = {
  neutrals: [
    "#000000", "#050505", "#09090b", "#0b1020", "#111827", "#18181b", 
    "#27272a", "#3f3f46", "#52525b", "#71717a", "#d4d4d8", "#ffffff"
  ],
  cool: [
    "#020617", "#0f172a", "#1e293b", "#334155", "#1e1b4b", "#312e81", 
    "#1e40af", "#1d4ed8", "#2563eb", "#022c22", "#064e3b", "#065f46"
  ],
  warm: [
    "#2e1065", "#4c1d95", "#5b21b6", "#7c2d12", "#9a3412", "#c2410c", 
    "#ea580c", "#78350f", "#92400e", "#a16207", "#b45309", "#d97706"
  ],
  vibrant: [
    "#be123c", "#9f1239", "#e11d48", "#701a75", "#86198f", "#a21caf",
    "#4338ca", "#3730a3", "#4f46e5", "#15803d", "#166534", "#16a34a"
  ]
};

// ---------- GRADIENT PRESETS ----------
export const gradientPresets = {
  single: {
    cool: [
      { name: "Midnight", value: "linear-gradient(180deg, #020617, #0f172a, #0c0c0c00, #0c0c0c00, #0c0c0c00)" },
      { name: "Deep Sea", value: "linear-gradient(180deg, #020617, #022c22, #0c0c0c00, #0c0c0c00, #0c0c0c00)" },
      { name: "Slate Mist", value: "linear-gradient(180deg, #0f172a, #334155, #0c0c0c00, #0c0c0c00, #0c0c0c00)" },
      { name: "Indigo Night", value: "linear-gradient(180deg, #1e1b4b, #312e81, #0c0c0c00, #0c0c0c00, #0c0c0c00)" },
      { name: "Boreal", value: "linear-gradient(180deg, #064e3b, #022c22, #0c0c0c00, #0c0c0c00, #0c0c0c00)" },
    ],
    warm: [
      { name: "Ember", value: "linear-gradient(180deg, #2e1065, #7c2d12, #0c0c0c00, #0c0c0c00, #0c0c0c00)" },
      { name: "Crimson", value: "linear-gradient(180deg, #450a0a, #7f1d1d, #0c0c0c00, #0c0c0c00, #0c0c0c00)" },
      { name: "Rust", value: "linear-gradient(180deg, #7c2d12, #9a3412, #0c0c0c00, #0c0c0c00, #0c0c0c00)" },
      { name: "Violet Dusk", value: "linear-gradient(180deg, #2e1065, #4c1d95, #0c0c0c00, #0c0c0c00, #0c0c0c00)" },
    ],
  },

  multi: {
    cool: [
      { name: "Aurora", value: "linear-gradient(180deg, #0369a1, #1e40af, #0c0c0c00, #0c0c0c00, #0c0c0c00)" },
      { name: "Arctic Blue", value: "linear-gradient(180deg,  #2563eb, #60a5fa, #0c0c0c00, #0c0c0c00, #0c0c0c00)" },
      { name: "Neon Forest", value: "linear-gradient(180deg,  #059669, #34d399, #0c0c0c00, #0c0c0c00, #0c0c0c00)" },
      { name: "Cyberpunk", value: "linear-gradient(180deg,  #4338ca, #7c3aed, #0c0c0c00, #0c0c0c00, #0c0c0c00)" },
      { name: "Oceanic", value: "linear-gradient(180deg,  #0284c7, #38bdf8, #0c0c0c00, #0c0c0c00, #0c0c0c00)" },
    ],
    warm: [
      { name: "Sunset", value: "linear-gradient(180deg,  #ea580c, #f59e0b, #0c0c0c00, #0c0c0c00, #0c0c0c00)" },
      { name: "Velvet", value: "linear-gradient(180deg,  #9333ea, #db2777, #0c0c0c00, #0c0c0c00, #0c0c0c00)" },
      { name: "Autumn", value: "linear-gradient(180deg,  #92400e, #d97706, #0c0c0c00, #0c0c0c00, #0c0c0c00)" },
      { name: "Magma", value: "linear-gradient(180deg,  #991b1b, #dc2626, #0c0c0c00, #0c0c0c00, #0c0c0c00)" },
      { name: "Rose Garden", value: "linear-gradient(180deg,  #be123c, #fb7185, #0c0c0c00, #0c0c0c00, #0c0c0c00)" },
    ],
  },
};

export const meshGradients = {
  special: [
    {
      name: "Atomic Lava",
      value: "radial-gradient(circle at 20% -40%, rgba(255, 0, 0, 0.7), transparent 60%)," +
             "radial-gradient(circle at 80% -40%, rgb(255, 129, 11), transparent 60%)," +
             "radial-gradient(circle at 80% -40%, rgb(255, 255, 255), transparent 60%)," +
             "linear-gradient(180deg, #0c0c0c00, #0c0c0c00)"
    }
  ],
  atmospheric: [
    {
      name: "Ember Glow",
      value: "linear-gradient(180deg, #050505, #000000)" + 
             "radial-gradient(circle at 0% -40%, rgba(255,42,42,0.38), transparent 55%)," +
             "radial-gradient(circle at 40% -40%, rgba(255,140,26,0.28), transparent 60%)," +
             "linear-gradient(180deg, #0c0c0c00, #0c0c0c00)"
    },
    {
      name: "Midnight Aurora",
      value: "radial-gradient(circle at 30% -40%, rgba(34,197,94,0.35), transparent 60%)," +
             "radial-gradient(circle at 70% -40%, rgba(14,165,233,0.3), transparent 60%)," +
             "linear-gradient(180deg, #0c0c0c00, #0c0c0c00)"
    },
    {
      name: "Deep Nebula",
      value: "radial-gradient(circle at 50% -40%, rgba(168,85,247,0.32), transparent 65%)," +
             "radial-gradient(circle at 80% -40%, rgba(236,72,153,0.25), transparent 60%)," +
             "linear-gradient(180deg, #0c0c0c00, #0c0c0c00)"
    },
    {
      name: "Oceanic Abyss",
      value: "radial-gradient(circle at 10% -40%, rgba(14,165,233,0.3), transparent 50%)," +
             "radial-gradient(circle at 90% -40%, rgba(30,58,138,0.4), transparent 60%)," +
             "linear-gradient(180deg, #0c0c0c00, #0c0c0c00)"
    }
  ],
  weather: [
    {
      name: "Thunderstorm",
      value: "radial-gradient(circle at 50% -40%, rgba(124,58,237,0.25), transparent 70%)," +
             "radial-gradient(circle at 20% -40%, rgba(59,130,246,0.2), transparent 60%)," +
             "linear-gradient(180deg, #0c0c0c00, #0c0c0c00)"
    },
    {
      name: "Arctic Mist",
      value: "radial-gradient(circle at 80% -40%, rgba(203,213,225,0.25), transparent 50%)," +
             "radial-gradient(circle at 20% -40%, rgba(148,163,184,0.15), transparent 50%)," +
             "linear-gradient(180deg, #0c0c0c00, #0c0c0c00)"
    },
    {
      name: "Golden Hour",
      value: "radial-gradient(circle at 20% -70%, rgba(245, 159, 11, 0.63), transparent 70%)," +
             "radial-gradient(circle at 80% -30%, rgba(251, 113, 134, 0.73), transparent 50%)," +
             "linear-gradient(180deg, #0c0c0c00, #0c0c0c00)"
    }
  ],
  seasonal: [
    {
      name: "Spring Bloom",
      value: "radial-gradient(circle at 30% -40%, rgba(217,70,239,0.2), transparent 60%)," +
             "radial-gradient(circle at 70% -40%, rgba(74,222,128,0.15), transparent 60%)," +
             "linear-gradient(180deg, #0c0c0c00, #0c0c0c00)"
    },
    {
      name: "Autumn Leaves",
      value: "radial-gradient(circle at 20% -40%, rgba(234, 90, 12, 0.7), transparent 60%)," +
             "radial-gradient(circle at 80% -40%, rgba(233, 136, 45, 0.75), transparent 60%)," +
             "radial-gradient(circle at 80% -40%, rgba(247, 212, 180, 0.45), transparent 60%)," +
             "linear-gradient(180deg, #0c0c0c00, #0c0c0c00)"
    }
  ]
};

// ---------- Animated Gradients ----------
export const animatedGradients = [
  {
    name: "Animated Aurora",
    value: "linear-gradient(270deg, #1e75af, #0369a1, #064e3b, #0c0c0c00, #0c0c0c00, #0c0c0c00)",
    animation: {
      backgroundSize: "400% 400%",
      animation: "gradientShift 12s ease infinite",
    },
  },
  {
    name: "Deep Space",
    value: "linear-gradient(270deg, #1e1b4b, #2e1065, #000000, #0c0c0c00, #0c0c0c00, #0c0c0c00)",
    animation: {
      backgroundSize: "400% 400%",
      animation: "gradientShift 15s ease infinite",
    },
  },
  {
    name: "Golden Pulse",
    value: "linear-gradient(270deg, #92400e, #7c2d12, #451a03, #0c0c0c00, #0c0c0c00, #0c0c0c00)",
    animation: {
      backgroundSize: "400% 400%",
      animation: "gradientShift 10s ease infinite",
    },
  },
  {
    name: "Electric Dream",
    value: "linear-gradient(270deg, #4338ca, #7c3aed, #db2777, #0c0c0c00, #0c0c0c00, #0c0c0c00)",
    animation: {
      backgroundSize: "400% 400%",
      animation: "gradientShift 8s ease infinite",
    },
  }
];

// ---------- Background API ----------
export const Backgrounds = {
  // Returns a raw solid hex based on category (neutrals, cool, warm, vibrant)
  solidByIndex: ({ category, index }) => {
    const list = solidPresets[category] || solidPresets.neutrals;
    return list[index % list.length];
  },

  // Returns a standard linear gradient object { name, value }
  gradientByIndex: ({ type, category, index }) => {
    const list =
      gradientPresets[type]?.[category] ||
      gradientPresets.single.cool;
    return list[index % list.length];
  },

  // Returns a complex mesh gradient object { name, value }
  meshByIndex: ({ category, index }) => {
    const list = meshGradients[category] || meshGradients.atmospheric;
    return list[index % list.length];
  },

  // Returns an animated gradient object { name, value, animation }
  animatedGradientByIndex: ({ index }) =>
    animatedGradients[index % animatedGradients.length],

  // --- COMPOSITION METHODS ---
  
  // Creates CSS for Solids
  composeSolid: (color) => ({
    backgroundColor: color,
    backgroundImage: "none",
    color: getContrastText(color),
    transition: "all 0.8s ease",
  }),

  // Creates CSS for any Gradient (Standard, Mesh, or Animated)
  composeGradient: (gradientValue, animationStyles = {}) => ({
    backgroundImage: gradientValue,
    backgroundAttachment: "fixed",
    backgroundSize: "cover",
    backgroundPosition: "center",
    transition: "all 1.2s ease-in-out",
    ...animationStyles,
  }),
};