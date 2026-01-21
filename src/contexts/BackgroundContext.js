import { createContext, useContext, useState, useEffect } from "react";

// Added "mesh" to types and "vibrant" to categories
export const BACKGROUND_TYPES = ["solid", "gradient", "mesh"];
export const GRADIENT_TYPES = ["single", "multi"];
export const COLOR_CATEGORIES = ["neutrals", "cool", "warm", "light", "vibrant"];
export const MESH_CATEGORIES = ["atmospheric", "weather", "seasonal", "special"];

const BackgroundContext = createContext(null);

export function BackgroundProvider({ children }) {
  const [backgroundType, setBackgroundType] = useState(
    localStorage.getItem("bg_type") || "solid"
  );

  const [category, setCategory] = useState(
    localStorage.getItem("bg_category") || "cool"
  );

  const [gradientType, setGradientType] = useState(
    localStorage.getItem("bg_gradient_type") || "single"
  );

  const [presetIndex, setPresetIndex] = useState(
    Number(localStorage.getItem("bg_preset_index")) || 0
  );

  const [animated, setAnimated] = useState(
    localStorage.getItem("bg_animated") === "true"
  );

  // Persistence logic
  useEffect(() => {
    localStorage.setItem("bg_type", backgroundType);
    localStorage.setItem("bg_category", category);
    localStorage.setItem("bg_gradient_type", gradientType);
    localStorage.setItem("bg_preset_index", presetIndex);
    localStorage.setItem("bg_animated", animated);
  }, [backgroundType, category, gradientType, presetIndex, animated]);

  return (
    <BackgroundContext.Provider
      value={{
        backgroundType,
        setBackgroundType,
        category,
        setCategory,
        gradientType,
        setGradientType,
        presetIndex,
        setPresetIndex,
        animated,
        setAnimated,
      }}
    >
      {children}
    </BackgroundContext.Provider>
  );
}

export const useBackground = () => {
  const ctx = useContext(BackgroundContext);
  if (!ctx)
    throw new Error(
      "useBackground must be used inside BackgroundProvider"
    );
  return ctx;
};