import EChartsStat from "echarts-stat";

/**
 * The win-count + median-ratio summary every A/B parity chart reports
 * instead of a regression gradient alone (CLAUDE.md's domain conventions).
 * `better` matches the metric registry's convention: "higher" if B > A is
 * the win, "lower" if B < A is, `null`/undefined if there's no direction
 * (then `winCount`/the win-count line are both omitted).
 *
 * Regression needs at least two points to fit — `regression` is `null`
 * below that, and the "fit" line is omitted too.
 */
export function abSummary(points, better) {
    const regression = points.length >= 2
        ? EChartsStat.regression("linear", points.map(p => [p.A, p.B]))
        : null;

    const ratios = points
        .map(p => p.B / p.A)
        .filter(Number.isFinite)
        .sort((a, b) => a - b);

    const median = ratios.length
        ? ratios.length % 2
            ? ratios[(ratios.length - 1) / 2]
            : (ratios[ratios.length / 2 - 1] + ratios[ratios.length / 2]) / 2
        : null;

    const symbol = better === "higher" ? ">" : "<";
    const winCount = better
        ? points.filter(p => better === "higher" ? p.B > p.A : p.B < p.A).length
        : null;

    const lines = [
        winCount !== null ? `B ${symbol} A on ${winCount}/${points.length}` : null,
        median !== null ? `median B/A = ${median.toFixed(3)}` : null,
        regression ? `fit: ${regression.expression}` : null,
    ].filter(Boolean);

    return { regression, median, winCount, symbol, lines, text: lines.join("\n") };
}
