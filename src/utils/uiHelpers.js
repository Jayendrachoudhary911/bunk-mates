export const getDynamicBorderRadius = (index, total) => {
  if (total === 1) return "20px";
  if (index === 0) return "20px 20px 7px 7px";
  if (index === total - 1) return "7px 7px 20px 20px";
  return "7px";
};

export const isValidImageUrl = (url) => {
  if (!url || typeof url !== "string") return false;
  const trimmed = url.trim();
  if (!trimmed || trimmed === "undefined" || trimmed === "null" || trimmed === "none") return false;
  return (
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("data:image/") ||
    trimmed.startsWith("blob:") ||
    (trimmed.startsWith("/") && /^\/[a-zA-Z0-9_\-./]+$/.test(trimmed))
  );
};

export const safeImageUrl = (url, fallback = "") => {
  return isValidImageUrl(url) ? url : fallback;
};
