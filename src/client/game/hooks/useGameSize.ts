import { useEffect, useState } from "react"

// Three discrete layout tiers. The game renders at a fixed, hand-tuned size for
// the chosen tier (see the `[data-am-size="..."]` token blocks in GlobalStyles).
// We pick the tier from the *viewport only* — never from the game's own
// rendered size — so there is no measure→resize→measure feedback loop (the bug
// that made the old FitToViewport scaler shrink on every route change).
export type GameSize = "small" | "medium" | "large"

// Every tier reserves room for a host header + footer (50px + 150px = 200px),
// so the game fits even when embedded in a page with surrounding chrome.
const RESERVED_CHROME = 200

// Minimum viewport a tier needs. `height` is the viewport height *minus* the
// reserved chrome (i.e. the space actually available to the game).
const TIERS: { size: GameSize; minWidth: number; minHeight: number }[] = [
  { size: "large", minWidth: 880, minHeight: 700 },
  { size: "medium", minWidth: 600, minHeight: 480 },
  { size: "small", minWidth: 0, minHeight: 0 },
]

function pickSize(width: number, height: number): GameSize {
  const available = height - RESERVED_CHROME
  for (const tier of TIERS) {
    if (width >= tier.minWidth && available >= tier.minHeight) return tier.size
  }
  return "small"
}

function currentSize(): GameSize {
  if (typeof window === "undefined") return "large"
  return pickSize(window.innerWidth, window.innerHeight)
}

export function useGameSize(): GameSize {
  const [size, setSize] = useState<GameSize>(currentSize)

  useEffect(() => {
    let raf = 0
    const onResize = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => setSize(currentSize()))
    }
    window.addEventListener("resize", onResize)
    onResize()
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener("resize", onResize)
    }
  }, [])

  return size
}
