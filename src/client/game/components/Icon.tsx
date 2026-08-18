import styled from "@emotion/styled"

// Figma exports every icon as a fixed-size artboard ("outer box") with the
// drawn glyph ("leaf") inset inside it. Both are reproduced verbatim: the box
// sets the layout footprint, the inset positions the glyph within it. Sizing
// the <img> directly instead would drop the designed padding and stretch the
// glyph, since the leaves have different aspect ratios from their boxes.
const IconBox = styled.span<{ $size: number }>`
  position: relative;
  display: block;
  flex: none;
  width: ${p => p.$size}px;
  height: ${p => p.$size}px;
  overflow: hidden;
`

const IconLeaf = styled.span<{ $inset: string }>`
  position: absolute;
  inset: ${p => p.$inset};
  display: block;

  img {
    display: block;
    width: 100%;
    height: 100%;
    max-width: none;
  }
`

interface IconProps {
  src: string
  /** Size of the exported artboard, in px. */
  size: number
  /** CSS inset (top right bottom left) of the glyph within the artboard. */
  inset: string
  className?: string
}

export function Icon({ src, size, inset, className }: IconProps) {
  return (
    <IconBox $size={size} className={className} aria-hidden="true">
      <IconLeaf $inset={inset}>
        <img src={src} alt="" />
      </IconLeaf>
    </IconBox>
  )
}
