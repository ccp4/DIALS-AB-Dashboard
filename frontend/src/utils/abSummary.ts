import EChartsStat from "echarts-stat";

interface ABPoint {
    A: number;
    B: number;
}

type Better = "higher" | "lower" | null | undefined;

/**
 * The win-count + median-ratio summary every A/B parity chart reports,
 * with a regression fit as a secondary line. `better`: "higher" if B > A
 * is the win, "lower" if B < A is, `null`/undefined for no direction (then
 * `winCount`/its line are omitted). `regression` is `null` below 2 points.
 */
export function abSummary(points: ABPoint[], better: Better) {
    // `order` (3rd arg) only applies to "polynomial" regression and defaults to 2
    // when omitted — echarts-stat's own types mark it required regardless.
    const regression = points.length >= 2
        ? EChartsStat.regression("linear", points.map(p => [p.A, p.B]), 2)
        : null;

    const ratios = points
        .map(p => p.B / p.A)
        .filter(Number.isFinite)
        .sort((a, b) => a - b);

    const median = ratios.length
        ? ratios.length % 2
            ? ratios[(ratios.length - 1) / 2]!
            : (ratios[ratios.length / 2 - 1]! + ratios[ratios.length / 2]!) / 2
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
