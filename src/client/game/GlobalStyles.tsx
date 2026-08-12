import { Global, css } from "@emotion/react"

const globalCss = css`
  /* ──────────────────────────────────────────────────────────────────────
     Brand tokens (MIT design system). These do not vary by size tier, so
     they live on :root rather than in the [data-am-size] blocks below.
     ────────────────────────────────────────────────────────────────────── */
  :root {
    --am-font: "Neue Haas Grotesk Text Pro", system-ui, -apple-system,
      "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;

    --am-mit-red: #750014;
    --am-red: #a31f34;
    --am-white: #ffffff;
    --am-text-primary: #212326;
    --am-text-secondary: #626a73;
    --am-light-gray-0: #f7f7f7;
    --am-light-gray-1: #f3f4f8;
    --am-light-gray-2: #dde1e6;
    --am-light-silver-gray: #b8c2cc;
    --am-green: #008000;
    --am-dark-green: #004d1a;

    --am-radius: 4px;
    --am-card-shadow: 0 8px 10px rgba(120, 147, 172, 0.1);
    --am-btn-shadow: 0 2px 4px rgba(37, 38, 43, 0.1),
      0 3px 8px rgba(37, 38, 43, 0.12);
    --am-modal-shadow: 0 4px 8px rgba(19, 20, 21, 0.08);
  }

  body {
    font-family: var(--am-font);
    background: var(--am-light-gray-1);
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
    --am-container-max: 1188px;
    --am-container-margin: 16px;
    --am-page-pad: 24px;
    --am-col-gap: 32px;
    --am-sidebar-w: 344px;

    --am-board-pad-y: 64px;
    --am-board-pad-x: 40px;
    --am-board-gap: 32px;
    --am-title-gap: 32px;

    --am-eq-gap: 16px;
    --am-eq-font: 18px;
    --am-slot-px: 32px;
    --am-slot-py: 16px;
    --am-target: 60px;

    --am-tile: 48px;
    --am-tile-px: 24px;
    --am-tile-font: 16px;
    --am-bank-gap: 24px;

    --am-controls-pad: 24px;
    --am-mode-btn-w: 200px;
  }

  [data-am-size="medium"] {
    --am-container-max: 980px;
    --am-container-margin: 14px;
    --am-page-pad: 16px;
    --am-col-gap: 24px;
    --am-sidebar-w: 280px;

    --am-board-pad-y: 40px;
    --am-board-pad-x: 32px;
    --am-board-gap: 24px;
    --am-title-gap: 24px;

    --am-eq-gap: 12px;
    --am-eq-font: 16px;
    --am-slot-px: 24px;
    --am-slot-py: 14px;
    --am-target: 54px;

    --am-tile: 44px;
    --am-tile-px: 18px;
    --am-tile-font: 15px;
    --am-bank-gap: 16px;

    --am-controls-pad: 20px;
    --am-mode-btn-w: 170px;
  }

  [data-am-size="small"] {
    --am-container-max: 100%;
    --am-container-margin: 6px;
    --am-page-pad: 8px;
    --am-col-gap: 16px;
    --am-sidebar-w: 100%;

    --am-board-pad-y: 24px;
    --am-board-pad-x: 16px;
    --am-board-gap: 20px;
    --am-title-gap: 16px;

    --am-eq-gap: 8px;
    --am-eq-font: 15px;
    --am-slot-px: 14px;
    --am-slot-py: 10px;
    --am-target: 46px;

    --am-tile: 38px;
    --am-tile-px: 12px;
    --am-tile-font: 14px;
    --am-bank-gap: 10px;

    --am-controls-pad: 16px;
    --am-mode-btn-w: 100%;
  }
`

export const GlobalStyles = () => <Global styles={globalCss} />
