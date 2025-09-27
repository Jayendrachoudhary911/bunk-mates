export const getDynamicBorderRadius = (index, total) => {
  if (total === 1) return "20px";
  if (index === 0) return "20px 20px 7px 7px";
  if (index === total - 1) return "7px 7px 20px 20px";
  return "7px";
};
