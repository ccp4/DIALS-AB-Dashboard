/**
 * Every colour, font size and chart dimension the dashboard draws with.
 *
 * `tokens` is the active set. `palettes` holds light and dark side by side so
 * the dark values are recorded rather than invented later; `MODE` is the single
 * place a mode toggle would be introduced, and there is deliberately no toggle
 * yet.
 *
 * Two groups of colour that must not be confused:
 *
 * - `variant.A` / `variant.B` are data encoding. A is the same colour in every
 *   chart no matter how many series are on screen, so they are read directly
 *   and never through a palette index.
 * - `series` is the fallback categorical order for charts whose series are not
 *   A and B (runs, traces). It deliberately excludes the two variant hues, so
 *   an unthemed two-series chart cannot come out blue-then-orange and be
 *   misread as an A/B comparison.
 */

const font = {
    family: 'system-ui, -apple-system, "Segoe UI", sans-serif',
    size: {
        title: 16,
        label: 12,
        annotation: 14,
    },
};

const space = {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 40,
};

const chart = {
    height: {
        sparkline: 220,
        panel: 450,
        full: 600,
        tall: "70vh",
    },
    width: {
        main: "75vw",
    },
    lineWidth: 2,
    symbolSize: 8,
};

const palettes = {
    light: {
        variant: {
            A: "#2a78d6",
            B: "#eb6834",
        },
        series: [
            "#1baf7a",
            "#eda100",
            "#e87ba4",
            "#008300",
            "#4a3aa7",
            "#e34948",
        ],
        ink: {
            strong: "#0b0b0b",
            base: "#52514e",
            muted: "#898781",
        },
        line: {
            axis: "#c3c2b7",
            grid: "#e1e0d9",
            reference: "#c3c2b7",
            annotation: "#52514e",
        },
        surface: {
            chart: "#fcfcfb",
            page: "#f9f9f7",
            overlay: "rgba(252, 252, 251, 0.9)",
            border: "rgba(11, 11, 11, 0.10)",
        },
        brand: {
            primary: "#0f6e6b",
            secondary: "#9c27b0",
        },
    },

    dark: {
        variant: {
            A: "#3987e5",
            B: "#d95926",
        },
        series: [
            "#199e70",
            "#c98500",
            "#d55181",
            "#008300",
            "#9085e9",
            "#e66767",
        ],
        ink: {
            strong: "#ffffff",
            base: "#c3c2b7",
            muted: "#898781",
        },
        line: {
            axis: "#383835",
            grid: "#2c2c2a",
            reference: "#383835",
            annotation: "#c3c2b7",
        },
        surface: {
            chart: "#1a1a19",
            page: "#0d0d0d",
            overlay: "rgba(26, 26, 25, 0.9)",
            border: "rgba(255, 255, 255, 0.10)",
        },
        brand: {
            primary: "#2a9d99",
            secondary: "#ce93d8",
        },
    },
};

/** A `#rrggbb` token plus an alpha channel, for translucent fills. */
export function withAlpha(hex, a) {
    const n = parseInt(hex.slice(1), 16);

    return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
}

export const MODE = "light";

export const tokens = {
    ...palettes[MODE],
    font,
    space,
    chart,
};

export { palettes };
