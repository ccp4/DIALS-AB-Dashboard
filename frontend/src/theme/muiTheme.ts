/**
 * The MUI theme, built from the tokens so the app chrome and the charts draw
 * from one set of values.
 *
 * `primary` is deliberately not the A/B blue: buttons sitting beside a chart
 * would otherwise read as A-coloured data.
 */

import { createTheme } from "@mui/material";

import { MODE, tokens } from "./tokens";

const muiTheme = createTheme({
    palette: {
        mode: MODE,
        primary: {
            main: tokens.brand.primary,
        },
        secondary: {
            main: tokens.brand.secondary,
        },
        text: {
            primary: tokens.ink.strong,
            secondary: tokens.ink.base,
        },
        background: {
            default: tokens.surface.page,
            paper: tokens.surface.chart,
        },
        divider: tokens.surface.border,
    },

    typography: {
        fontFamily: tokens.font.family,
    },
});

export default muiTheme;
