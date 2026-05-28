import styled from "@emotion/styled"
import { useGameState, useGameDispatch } from "../context/GameContext"
import type { BankItem } from "../types"

const DISPLAY_OPS: Record<string, string> = {
  "*": "×",
  "/": "÷",
}

const TemplateWrapper = styled.div`
  padding: var(--am-area-pad);
  border-radius: 8px;
  background: #ffffff;
  border: 1px solid #d0d0d0;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  min-height: var(--am-area-min-h);
  margin-bottom: var(--am-template-gap);
  touch-action: none;
  -webkit-user-select: none;
  user-select: none;
  -webkit-touch-callout: none;

  .menu-mode & {
    margin-bottom: 0;
  }
`

const EquationRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--am-gap);
  white-space: nowrap;
  min-width: 100%;
  box-sizing: border-box;
`

const InlineToken = styled.span`
  display: inline-block;
  padding: 4px 6px;
  font-weight: 700;
  color: #0f172a;
  background: transparent;
  border-radius: 4px;
  font-size: var(--am-token-font);
`

const SlotWrapper = styled.div`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: var(--am-tile);
  height: var(--am-tile);
  border-radius: 8px;
  border: 0;
  background: linear-gradient(180deg, #f5f5f5, #e0e0e0);
  box-shadow: inset 0 -2px 0 rgba(255, 255, 255, 0.6);
  font-weight: 700;
  font-size: var(--am-tile-font);
  color: #0f172a;
  touch-action: none;
  -webkit-user-select: none;
  user-select: none;
  -webkit-touch-callout: none;

  &:focus-visible {
    outline: 3px solid #0f172a;
    outline-offset: 2px;
  }
`

const SlotTile = styled.div`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: var(--am-tile);
  height: var(--am-tile);
  padding: 0 var(--am-tile-pad);
  background: #750014;
  color: white;
  font-weight: 700;
  font-size: var(--am-tile-font);
  border-radius: 10px;
  cursor: grab;
  user-select: none;
  box-shadow: 0 6px 14px rgba(30, 30, 30, 0.28);
`

interface SlotProps {
  index: number
  tile: BankItem | undefined
  onDrop: (tileId: string, slotIndex: number) => void
  onRemove: (slotIndex: number) => void
}

function Slot({ index, tile, onDrop, onRemove }: SlotProps) {
  return (
    <SlotWrapper
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
  const { puzzle, bankItems } = useGameState()
  const dispatch = useGameDispatch()

  if (!puzzle) {
    return (
      <TemplateWrapper>
        <p style={{ textAlign: "center", color: "#999", padding: "20px", margin: 0, fontSize: "16px", fontWeight: 500 }}>
          Select a mode to begin
        </p>
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
                onDrop={handleDrop}
                onRemove={handleRemove}
              />
            )
          }

          return (
            <InlineToken key={`token-${i}`}>
              {DISPLAY_OPS[tok] || tok}
            </InlineToken>
          )
        })}
      </EquationRow>
    </TemplateWrapper>
  )
}
