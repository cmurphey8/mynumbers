import styled from "@emotion/styled"
import { useGameState, useGameDispatch } from "../context/GameContext"
import { PrimaryButton } from "./ui"

const BankRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: var(--am-bank-gap);
  width: 100%;
  min-height: var(--am-tile);
  /* The bank covers much of the board, so suppressing gestures here stops a
     swipe that starts on it from panning the page at all — and on a narrow
     screen the page is what the player has to pan to reach the target. Tiles
     are placed by tap, and native drag-and-drop does not fire from touch, so
     there is no drag for panning to interfere with. */
  touch-action: manipulation;
  -webkit-user-select: none;
  user-select: none;
  -webkit-touch-callout: none;
`

const BankChip = styled(PrimaryButton)`
  height: var(--am-tile);
  min-width: var(--am-tile);
  padding: 0 var(--am-tile-px);
  font-size: var(--am-tile-font);
  cursor: grab;
`

export function Bank() {
  const { bankItems } = useGameState()
  const dispatch = useGameDispatch()

  const unplacedItems = bankItems.filter(item => item.placedInSlot === null)

  return (
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
      type="button"
      aria-label={`Place ${item.value} into the next empty slot`}
      draggable
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = "move"
        e.dataTransfer.setData("text/plain", item.id)
      }}
      onClick={handleClick}
    >
      {item.value}
    </BankChip>
  )
}
