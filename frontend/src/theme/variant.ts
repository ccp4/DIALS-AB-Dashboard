/**
 * Colour identifies the variant (A/B); line style carries everything else —
 * run identity in the multi-run charts, trace identity in the per-dataset
 * ones. `LINE_TYPES` repeats after 5, so two runs can share both.
 */

import { tokens } from "./tokens";

type Variant = "A" | "B";
type LineDash = string | number[];

const LINE_TYPES: LineDash[] = ["solid", "dashed", "dotted", [12, 4, 2, 4], [16, 4]];

/** The variant a backend series name belongs to: prefixed ("A - CC½ fit") or bare ("A"). */
export function variantOf(name: unknown): Variant | null {
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
export function lineType(index: number): LineDash {
    return LINE_TYPES[index % LINE_TYPES.length]!;
}

/** Colour and dash for one series, given its variant and its place in the group. */
export function variantSeriesStyle(variant: Variant, index = 0) {
    const color = tokens.variant[variant];

    return {
        itemStyle: { color },
        lineStyle: { color, type: lineType(index) },
    };
}
