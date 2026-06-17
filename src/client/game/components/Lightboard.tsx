import { useRef, useEffect } from "react"
import styled from "@emotion/styled"
import { useGameState } from "../context/GameContext"
import { showHomeLightboard, hideHomeLightboard } from "../home-lightboard"
import timThreeQuarterUrl from "../assets/Tim_three-quarter-full-RGB.svg"

const LIGHTBOARD_COLORS = [
  { color: "#ff6ec7", glow: "rgba(255,110,199,0.5)" },
  { color: "#39ff14", glow: "rgba(57,255,20,0.5)" },
  { color: "#ffe033", glow: "rgba(255,224,51,0.5)" },
  { color: "#00d4ff", glow: "rgba(0,212,255,0.5)" },
  { color: "#ff9d00", glow: "rgba(255,157,0,0.5)" },
  { color: "#c77dff", glow: "rgba(199,125,255,0.5)" },
]

const LIGHTBOARD_ZONES: number[][] = [
  [2, 5],  [34, 5],  [67, 5],
  [2, 32], [34, 32], [67, 32],
  [2, 59], [34, 59], [67, 59],
  [2, 79], [34, 79], [67, 79],
]

const Section = styled.div`
  position: relative;
  margin-top: 10px;
  margin-bottom: var(--am-board-mb);
`

const Board = styled.div`
  position: relative;
  width: 96%;
  box-sizing: border-box;
  height: var(--am-board-h);
  background: transparent;
  border-radius: 6px;
  border: 4px solid #40464c;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.9);
  overflow: hidden;

  &::before {
    content: "";
    position: absolute;
    inset: 0;
    background: linear-gradient(
      to right,
      rgba(35, 35, 38, 0.8) 0%,
      rgba(98, 106, 115, 0.8) 70%,
      rgba(139, 149, 158, 0.55) 100%
    );
    border-radius: 2px;
    box-shadow: inset 0 0 250px rgba(0, 5, 40, 0.35);
    pointer-events: none;
    z-index: 2;
  }

  &::after {
    content: "";
    position: absolute;
    inset: 0;
    background: linear-gradient(
      135deg,
      rgba(255, 255, 255, 0.03) 0%,
      transparent 60%
    );
    pointer-events: none;
    z-index: 5;
  }
`

const Tim = styled.img`
  position: absolute;
  right: 0;
  bottom: clamp(-75px, -8.3vw, -40px);
  height: clamp(159px, 33.3vw, 300px);
  width: 36%;
  object-fit: cover;
  object-position: right center;
  opacity: 0.9;
  filter: brightness(0.88) saturate(0.9);
  pointer-events: none;
`

const Surface = styled.div`
  position: absolute;
  inset: 0;
  z-index: 3;
  pointer-events: none;
  overflow: hidden;
`

const EquationLine = styled.div`
  position: absolute;
  font-family: 'Caveat', cursive;
  font-size: clamp(12px, 3vw, 22px);
  font-weight: 600;
  white-space: nowrap;
  line-height: 1;
  padding: 0.3em 12px 0.2em 0;
  max-width: 30%;
  overflow: hidden;
  text-overflow: ellipsis;
  clip-path: inset(0 100% 0 0);
  animation: lb-write-in-eq 1.1s cubic-bezier(0.4, 0, 0.2, 1) forwards;
`


const HomeSurface = styled.div`
  position: absolute;
  inset: 0;
  z-index: 3;
  pointer-events: none;
  overflow: visible;
`

const HomeCanvas = styled.canvas`
  position: absolute;
  inset: 0;
  z-index: 4;
  pointer-events: none;
`

interface LightboardProps {
  equations: string[]
}

export function Lightboard({ equations }: LightboardProps) {
  const shuffledZonesRef = useRef<number[][]>(
    [...LIGHTBOARD_ZONES].sort(() => Math.random() - 0.5)
  )

  return (
    <Section>
      <Tim
        src={timThreeQuarterUrl}
        alt="Tim"
      />
      <Board>
        <Surface>
          {equations.map((expr, i) => {
            const zone = shuffledZonesRef.current[i % shuffledZonesRef.current.length]
            const palette = LIGHTBOARD_COLORS[i % LIGHTBOARD_COLORS.length]
            return (
              <EquationLine
                key={i}
                style={{
                  left: zone[0] + "%",
                  top: zone[1] + "%",
                  color: palette.color,
                  textShadow: `0 0 8px ${palette.glow}, 0 0 18px ${palette.glow}`,
                }}
              >
                {expr + "\u00A0"}
              </EquationLine>
            )
          })}
        </Surface>
      </Board>
    </Section>
  )
}

export function HomeLightboard() {
  const { showMenu } = useGameState()

  useEffect(() => {
    if (!showMenu) return
    showHomeLightboard()
    return () => hideHomeLightboard()
  }, [showMenu])

  if (!showMenu) return null

  return (
    <Section>
      <Tim
        src={timThreeQuarterUrl}
        alt="Tim"
      />
      <Board id="home-lightboard">
        <HomeSurface id="home-lb-surface" />
        <HomeCanvas id="home-lb-canvas" />
      </Board>
    </Section>
  )
}
