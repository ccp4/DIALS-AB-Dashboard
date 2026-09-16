/**
 * Registers the "dials" ECharts theme as an import side effect.
 *
 * The theme carries chrome only — fonts, ink, axis and grid lines, tooltip,
 * legend, dataZoom, and the fallback categorical palette. It deliberately does
 * not carry the A/B pair: a theme's `color` array is positional, so a chart
 * whose first series is an identity line would hand A the third entry. Charts
 * set `tokens.variant.A` / `.B` explicitly per series instead.
 *
 * Grid margins are also left out — they depend on axis name length, which a
 * theme cannot see, so each chart sets its own.
 *
 * Import once, from `main.jsx`, before anything renders a chart.
 */

import * as echarts from "echarts";

import { tokens } from "./tokens";

const axis = {
    axisLine: {
        show: true,
        lineStyle: { color: tokens.line.axis },
    },
    axisTick: {
        show: true,
        lineStyle: { color: tokens.line.axis },
    },
    axisLabel: {
        color: tokens.ink.muted,
        fontSize: tokens.font.size.label,
    },
    splitLine: {
        show: true,
        lineStyle: { color: tokens.line.grid },
    },
    nameTextStyle: {
        color: tokens.ink.base,
        fontSize: tokens.font.size.label,
    },
};

echarts.registerTheme("dials", {
    color: tokens.series,
    backgroundColor: tokens.surface.chart,

    textStyle: {
        fontFamily: tokens.font.family,
        fontSize: tokens.font.size.label,
    },

    title: {
        textStyle: {
            color: tokens.ink.strong,
            fontSize: tokens.font.size.title,
            fontWeight: 600,
        },
        subtextStyle: {
            color: tokens.ink.base,
            fontSize: tokens.font.size.label,
        },
    },

    grid: {
        containLabel: true,
    },

    categoryAxis: {
        ...axis,
        splitLine: { show: false },
    },
    valueAxis: axis,
    logAxis: axis,
    timeAxis: axis,

    legend: {
        textStyle: {
            color: tokens.ink.base,
            fontSize: tokens.font.size.label,
        },
        inactiveColor: tokens.ink.muted,
    },

    tooltip: {
        backgroundColor: tokens.surface.overlay,
        borderColor: tokens.surface.border,
        borderWidth: 1,
        textStyle: {
            color: tokens.ink.strong,
            fontSize: tokens.font.size.label,
        },
        axisPointer: {
            lineStyle: { color: tokens.line.axis },
            crossStyle: { color: tokens.line.axis },
            label: {
                backgroundColor: tokens.ink.base,
                fontSize: tokens.font.size.label,
            },
        },
    },

    dataZoom: {
        borderColor: tokens.line.grid,
        backgroundColor: tokens.surface.page,
        fillerColor: tokens.surface.border,
        handleStyle: { color: tokens.ink.muted },
        moveHandleStyle: { color: tokens.ink.muted },
        dataBackground: {
            lineStyle: { color: tokens.line.axis },
            areaStyle: { color: tokens.line.grid },
        },
        textStyle: {
            color: tokens.ink.muted,
            fontSize: tokens.font.size.label,
        },
    },

    line: {
        lineStyle: { width: tokens.chart.lineWidth },
        symbolSize: tokens.chart.symbolSize,
    },

    scatter: {
        symbolSize: tokens.chart.symbolSize,
    },
});
