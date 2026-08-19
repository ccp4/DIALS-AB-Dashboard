/**
 * Reading A/B identity off a series, and the second channel that carries
 * everything else.
 *
 * Colour is reserved for the variant — A is the same blue in every chart, B the
 * same orange — so whatever else a chart distinguishes needs another channel.
 * Line style is that channel: run identity in the multi-run charts, and trace
 * identity within one variant in the per-dataset ones.
 *
 * `LINE_TYPES` runs out after five. Beyond that the styles repeat, so two runs
 * on screen can share both colour and dash.
 */

import { tokens } from "./tokens";

const LINE_TYPES = ["solid", "dashed", "dotted", [12, 4, 2, 4], [16, 4]];

/**
 * The variant a backend series name belongs to, or null for one belonging to
 * neither.
 *
 * Names arrive in two shapes: prefixed ("A - CC½ fit", from the per-variant
 * resolution JSONs) and bare ("A", from the merging stats). See the series
 * contract in CLAUDE.md.
 */
export function variantOf(name) {
    if (typeof name !== "string") {
        return null;
    }

    if (name === "A" || name.startsWith("A - ")) {
        return "A";
    }

    if (name === "B" || name.startsWith("B - ")) {
        return "B";
    }

    return null;
}

/** Line style for the nth member of a group sharing one colour. */
export function lineType(index) {
    return LINE_TYPES[index % LINE_TYPES.length];
}

/** Colour and dash for one series, given its variant and its place in the group. */
export function variantSeriesStyle(variant, index = 0) {
    const color = tokens.variant[variant];

    return {
        itemStyle: { color },
        lineStyle: { color, type: lineType(index) },
    };
}
