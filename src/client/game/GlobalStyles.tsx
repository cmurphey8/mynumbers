import { Global, css } from "@emotion/react"

const globalCss = css`
  body {
    font-family: system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial;
    background: #e8e8e8;
    margin: 0;
    padding: 10px;
  }

  /* ──────────────────────────────────────────────────────────────────────
     Size tokens. The game's root element carries data-am-size (set from the
     useGameSize hook); every size-sensitive component reads these variables
     instead of hardcoded px, so the whole UI scales as one of three tiers.
     All tiers are tuned to fit within 100vh − 200px of host chrome.
     ────────────────────────────────────────────────────────────────────── */
  [data-am-size="large"] {
    --am-container-max: 720px;
    --am-container-pad: 16px;
    --am-container-margin: 16px;
    --am-tile: 44px;
    --am-tile-font: 18px;
    --am-tile-pad: 12px;
    --am-token-font: 18px;
    --am-gap: 8px;
    --am-area-pad: 8px;
    --am-area-min-h: 50px;
    --am-template-gap: 16px;
    --am-logo-w: min(520px, 84vw);
    --am-stat-large: 28px;
    --am-stat: 19px;
    --am-stat-label: 11px;
    --am-board-h: clamp(120px, 18vw, 185px);
    --am-board-mb: 14px;
    --am-btn-pad: 9px 14px;
    --am-btn-font: 15px;
  }

  [data-am-size="medium"] {
    --am-container-max: 720px;
    --am-container-pad: 14px;
    --am-container-margin: 14px;
    --am-tile: 38px;
    --am-tile-font: 16px;
    --am-tile-pad: 10px;
    --am-token-font: 16px;
    --am-gap: 7px;
    --am-area-pad: 8px;
    --am-area-min-h: 48px;
    --am-template-gap: 20px;
    --am-logo-w: min(480px, 88vw);
    --am-stat-large: 28px;
    --am-stat: 19px;
    --am-stat-label: 10px;
    --am-board-h: clamp(140px, 24vw, 220px);
    --am-board-mb: 20px;
    --am-btn-pad: 9px 12px;
    --am-btn-font: 14px;
  }

  [data-am-size="small"] {
    --am-container-max: 100%;
    --am-container-pad: 10px;
    --am-container-margin: 6px;
    --am-tile: 32px;
    --am-tile-font: 14px;
    --am-tile-pad: 6px;
    --am-token-font: 14px;
    --am-gap: 5px;
    --am-area-pad: 6px;
    --am-area-min-h: 44px;
    --am-template-gap: 14px;
    --am-logo-w: min(360px, 90vw);
    --am-stat-large: 24px;
    --am-stat: 16px;
    --am-stat-label: 9px;
    --am-board-h: clamp(120px, 34vw, 180px);
    --am-board-mb: 14px;
    --am-btn-pad: 8px 10px;
    --am-btn-font: 13px;
  }

  @keyframes lb-write-in-eq {
    0%   { clip-path: inset(0 100% 0 0); }
    100% { clip-path: inset(0 -40px 0 0); }
  }

  @keyframes lb-write-in {
    0%   { clip-path: inset(0 100% 0 0); }
    100% { clip-path: inset(0 0% 0 0); }
  }

  .home-lb-surface {
    position: absolute;
    inset: 0;
    z-index: 3;
    pointer-events: none;
    overflow: visible;
  }

  .home-lb-item {
    position: absolute;
    white-space: nowrap;
    line-height: 1;
    padding: 0.4em 12px 0.3em 0;
    clip-path: inset(0 100% 0 0);
    animation: lb-write-in 2.5s cubic-bezier(0.4, 0, 0.2, 1) both;
  }

  .home-lb-canvas {
    position: absolute;
    inset: 0;
    z-index: 4;
    pointer-events: none;
  }
`

export const GlobalStyles = () => <Global styles={globalCss} />

