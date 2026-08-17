import styled from "@emotion/styled"
import { useGameState, useGameDispatch } from "../context/GameContext"
import type { BankItem } from "../types"

const DISPLAY_OPS: Record<string, string> = {
  "*": "×",
  "/": "÷",
}

const TemplateWrapper = styled.div`
  width: 100%;
  /* The row is built to fit (see EquationRow), but a narrow enough card leaves
     it wider than the space available, and scrolling beats clipping the target.
     Panning has to stay available for that scroll — and the page's — to be
     reachable by touch; only double-tap zoom is dropped, so quick tile taps do
     not trigger it. Native drag-and-drop does not fire from touch, so nothing
     here needs gestures suppressed outright. */
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  touch-action: manipulation;
  -webkit-user-select: none;
  user-select: none;
  -webkit-touch-callout: none;
`

// One line, always. Long templates make the slots and target give up width
// rather than pushing the target off the edge. Operators keep their intrinsic
// min-content width, so only the boxes compress.
const EquationRow = styled.div`
  display: flex;
  flex-wrap: nowrap;
  align-items: center;
  justify-content: center;
  gap: var(--am-eq-gap);
  white-space: nowrap;
  width: 100%;
  box-sizing: border-box;
`

const Operator = styled.span<{ $correct?: boolean }>`
  color: ${p => (p.$correct ? "var(--am-red)" : "var(--am-text-primary)")};
  font-size: var(--am-eq-font);
  font-weight: 700;
  line-height: 26px;
`

/**
 * A drop target. Empty it is an underlined blank ("Box" in the design); filled
 * it holds the placed number tile, which turns green once the equation checks
 * out.
 */
const SlotWrapper = styled.div<{ $filled: boolean }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  /* Fixed basis, but allowed to shrink so a token-heavy equation still fits on
     one line. Never grows, so short equations keep the designed slot width. */
  flex: 0 1 auto;
  width: calc(var(--am-slot-px) * 2 + 12px);
  min-width: calc(var(--am-tile) * 0.8);
  height: calc(var(--am-slot-py) * 2 + 26px);
  border-bottom: ${p =>
    p.$filled ? "1px solid transparent" : "1px solid var(--am-text-secondary)"};

  &:focus-visible {
    outline: 2px solid var(--am-text-primary);
    outline-offset: 2px;
  }
`

// Fills its slot exactly, so dropping a number in cannot change the width of
// the row — the tile's own padding would otherwise make it wider than the blank
// it replaces and push the target out of view.
const SlotTile = styled.div<{ $correct?: boolean }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: var(--am-tile);
  border-radius: var(--am-radius);
  background: ${p => (p.$correct ? "var(--am-green)" : "var(--am-mit-red)")};
  box-shadow: var(--am-btn-shadow);
  color: var(--am-white);
  font-size: var(--am-tile-font);
  font-weight: 500;
  line-height: 16px;
  cursor: grab;
  user-select: none;
  transition: background 200ms;
`

/** The target value at the end of the equation. */
const Target = styled.div<{ $correct?: boolean }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;

  ${p =>
    p.$correct
      ? `
    flex: none;
    width: var(--am-target);
    height: var(--am-target);
    border-radius: var(--am-radius);
    background: var(--am-dark-green);
    color: var(--am-white);
    font-size: 24px;
    line-height: 30px;
  `
      : `
    flex: 0 1 auto;
    width: calc(var(--am-slot-px) * 2 + 12px);
    min-width: calc(var(--am-tile) * 0.8);
    height: calc(var(--am-slot-py) * 2 + 26px);
    border-bottom: 1px solid var(--am-text-secondary);
    color: var(--am-text-primary);
    font-size: var(--am-eq-font);
    line-height: 26px;
  `}

  transition: background 200ms, color 200ms;
`

const Placeholder = styled.p`
  margin: 0;
  color: var(--am-text-secondary);
  font-size: 16px;
  font-weight: 500;
  text-align: center;
`

interface SlotProps {
  index: number
  tile: BankItem | undefined
  correct: boolean
  onDrop: (tileId: string, slotIndex: number) => void
  onRemove: (slotIndex: number) => void
}

function Slot({ index, tile, correct, onDrop, onRemove }: SlotProps) {
  return (
    <SlotWrapper
      $filled={Boolean(tile)}
      data-slot-index={index}
      role={tile ? "button" : undefined}
      tabIndex={tile ? 0 : undefined}
      aria-label={tile ? `Remove ${tile.value} from slot ${index + 1}` : `Empty slot ${index + 1}`}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault()
        const tileId = e.dataTransfer.getData("text/plain")
        if (tileId) onDrop(tileId, index)
      }}
      onClick={() => {
        if (tile) onRemove(index)
      }}
      onKeyDown={(e) => {
        if (tile && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault()
          onRemove(index)
        }
      }}
    >
      {tile && (
        <SlotTile
          $correct={correct}
          draggable
          onDragStart={(e) => {
            e.dataTransfer.effectAllowed = "move"
            e.dataTransfer.setData("text/plain", tile.id)
          }}
        >
          {tile.value}
        </SlotTile>
      )}
    </SlotWrapper>
  )
}

export function TemplateArea() {
  const { puzzle, bankItems, result } = useGameState()
  const dispatch = useGameDispatch()
  const correct = result?.type === "success"

  if (!puzzle) {
    return (
      <TemplateWrapper>
        <Placeholder>Loading puzzle…</Placeholder>
      </TemplateWrapper>
    )
  }

  function handleDrop(tileId: string, slotIndex: number) {
    dispatch({ type: "PLACE_TILE", tileId, slotIndex })
  }

  function handleRemove(slotIndex: number) {
    dispatch({ type: "REMOVE_TILE", slotIndex })
  }

  return (
    <TemplateWrapper>
      <EquationRow>
        {puzzle.template_tokens.map((tok, i) => {
          const isSlot = tok.startsWith("{") && tok.endsWith("}")

          if (isSlot) {
            const slotIndex = parseInt(tok.slice(1, -1), 10)
            const tile = bankItems.find(item => item.placedInSlot === slotIndex)
            return (
              <Slot
                key={`slot-${slotIndex}`}
                index={slotIndex}
                tile={tile}
                correct={correct}
                onDrop={handleDrop}
                onRemove={handleRemove}
              />
            )
          }

          return (
            <Operator key={`token-${i}`}>
              {DISPLAY_OPS[tok] || tok}
            </Operator>
          )
        })}
        <Operator $correct={correct} aria-hidden="true">=</Operator>
        <Target $correct={correct} aria-label={`Target ${puzzle.target}`}>
          {puzzle.target}
        </Target>
      </EquationRow>
    </TemplateWrapper>
  )
}
