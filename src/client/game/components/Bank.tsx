import styled from "@emotion/styled"
import { useGameState, useGameDispatch } from "../context/GameContext"

const BankArea = styled.div`
  margin: 16px 0 8px;
  text-align: center;
`

const BankRow = styled.div`
  display: flex;
  gap: var(--am-gap);
  flex-wrap: wrap;
  justify-content: center;
  padding: var(--am-area-pad);
  border-radius: 8px;
  background: #f0f0f0;
  min-height: var(--am-area-min-h);
  touch-action: none;
  -webkit-user-select: none;
  user-select: none;
  -webkit-touch-callout: none;
`

const BankChip = styled.div`
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
  transition: box-shadow 120ms ease;
  touch-action: none;
  -webkit-user-select: none;
  -webkit-touch-callout: none;

  &:focus-visible {
    outline: 3px solid #0f172a;
    outline-offset: 2px;
  }
`

export function Bank() {
  const { bankItems } = useGameState()
  const dispatch = useGameDispatch()

  const unplacedItems = bankItems.filter(item => item.placedInSlot === null)

  return (
    <BankArea>
      <BankRow
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault()
          const tileId = e.dataTransfer.getData("text/plain")
          if (tileId) {
            const item = bankItems.find(i => i.id === tileId)
            if (item && item.placedInSlot !== null) {
              dispatch({ type: "REMOVE_TILE", slotIndex: item.placedInSlot })
            }
          }
        }}
      >
        {unplacedItems.map(item => (
          <BankTile key={item.id} item={item} />
        ))}
      </BankRow>
    </BankArea>
  )
}

function BankTile({ item }: { item: { id: string; value: number } }) {
  const { slotValues } = useGameState()
  const dispatch = useGameDispatch()

  function handleClick() {
    const nextEmpty = slotValues.findIndex(v => v === null)
    if (nextEmpty !== -1) {
      dispatch({ type: "PLACE_TILE", tileId: item.id, slotIndex: nextEmpty })
    }
  }

  return (
    <BankChip
      role="button"
      tabIndex={0}
      aria-label={`Place ${item.value} into the next empty slot`}
      draggable
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = "move"
        e.dataTransfer.setData("text/plain", item.id)
      }}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          handleClick()
        }
      }}
    >
      {item.value}
    </BankChip>
  )
}
