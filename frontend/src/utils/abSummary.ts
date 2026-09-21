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
 * the counts and their lines are omitted). `regression` is `null` below 2
 * points.
 *
 * Both directions are counted and reported: `winCount` alone against the
 * total reads as a loss whenever it falls below half, when the comparison
 * that carries the information is `winCount` against `lossCount`. The two
 * don't sum to `points.length` — the remainder is exact ties, which say
 * nothing either way.
 *
 * Note the comparison is exact, on the raw values, which can be finer than
 * what a chart displays — so a caller whose formatter rounds hard will report
 * wins on pairs its own labels show as equal. This is why
 * `CC_halfOverallChart` prints `d_min` to 4 d.p. and not the conventional 2.
 *
 * Phrased "B better" rather than "B > A" since the comparison is not always
 * in the units the axes are labelled in — `CC_halfOverallChart` plots
 * inverse-square-d under Å axis labels, so there a numerically greater value
 * is the *smaller* d_min. The other variant is left implicit: the two lines
 * sit together and name both sides between them.
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

    const bWins = (p: ABPoint) => better === "higher" ? p.B > p.A : p.B < p.A;
    const aWins = (p: ABPoint) => better === "higher" ? p.A > p.B : p.A < p.B;

    const winCount = better ? points.filter(bWins).length : null;
    const lossCount = better ? points.filter(aWins).length : null;

    const lines = [
        winCount !== null ? `B better for ${winCount}/${points.length}` : null,
        lossCount !== null ? `A better for ${lossCount}/${points.length}` : null,
        median !== null ? `median B/A = ${median.toFixed(3)}` : null,
        regression ? `fit: ${regression.expression}` : null,
    ].filter(Boolean);

    return { regression, median, winCount, lossCount, lines, text: lines.join("\n") };
}
