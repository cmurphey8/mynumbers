// ============================================================================
// Explainer — shared motion preference
// ============================================================================

export const reducedMotion =
  typeof window !== "undefined" &&
  typeof window.matchMedia === "function" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches
