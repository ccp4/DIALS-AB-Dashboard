import Chart from "../Chart";
import NoDataChart from "../NoDataChart";
import { tokens } from "../../theme/tokens";
import { STANDARD_DATA_ZOOM, summaryBoxGraphic } from "../../theme/chartChrome";
import { niceCeil } from "../../theme/chartScale";
import { abSummary } from "../../theme/abSummary";

// Convert (1/d)^2 -> d
function invSqToD(v) {
    if (
        v == null ||
        Number.isNaN(v) ||
        v <= 0
    ) {
        return null;
    }

    return 1 / Math.sqrt(v);
}

function formatD(v) {
    const d = invSqToD(v);
    return d != null ? d.toFixed(2) : "—";
}

/**
 * One B-against-A parity scatter per run, with an identity line, a linear fit
 * and a summary callout — the same shape as `MemoryABChart`, reused here.
 *
 * Values are the CC½ threshold crossing (`d_min`) DIALS computed per dataset,
 * stored as inverse-square-d; axis ticks and the tooltip convert to Å for
 * readability, but the identity line, regression and win-count are all
 * computed on the raw values, which is the space the chart is actually drawn
 * in. Higher raw value = smaller Å = better resolution, the opposite
 * direction from `MemoryABChart`'s "smaller is better" — so "B better"
 * here means `B > A`, not `B < A`.
 *
 * Only datasets with a finite value for both variants are plotted; the count
 * of those that survive is reported in the callout as the denominator.
 *
 * @param {Object<string, {A: Array<[string, number]>, B: Array<[string, number]>}>} data
 *        Keyed by run id.
 */
function CC_halfOverallChart({ data }) {

    const memory = data ?? {};
    const runs = Object.keys(memory);

    if (!runs.length) return null;

    // A single run gets a bigger, dedicated chart; multiple runs share the grid.
    const chartStyle = runs.length === 1
        ? { height: tokens.chart.height.single, width: tokens.chart.width.single }
        : { height: tokens.chart.height.panel, width: "100%" };

    return (
        <div
            style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(500px, 1fr))",
                justifyItems: runs.length === 1 ? "center" : "stretch",
                gap: "20px",
            }}
        >
            {runs.map((run) => {
                const runData = memory[run] ?? { A: [], B: [] };

                const aLookup = Object.fromEntries(runData.A ?? []);
                const bLookup = Object.fromEntries(runData.B ?? []);

                const points = Object.keys(aLookup)
                    .filter(dataset => Number.isFinite(aLookup[dataset]) && Number.isFinite(bLookup[dataset]))
                    .map(dataset => ({
                        value: [aLookup[dataset], bLookup[dataset]],
                        label: dataset,
                        A: aLookup[dataset],
                        B: bLookup[dataset],
                    }));

                if (!points.length) {
                    return (
                        <NoDataChart
                            key={run}
                            title={`${run}: CC½ resolution, A vs B`}
                            message="No comparable datasets"
                            style={chartStyle}
                        />
                    );
                }

                const maxValue = niceCeil(Math.max(
                    ...points.flatMap(p => [p.A, p.B]),
                    1
                ));

                const { regression, text: regressionSummary } = abSummary(points, "higher");

                const identityLine = [];
                const step = Math.max(maxValue / 100, 1);

                for (let x = 0; x <= maxValue; x += step) {
                    identityLine.push([x, x]);
                }

                if (identityLine.at(-1)?.[0] !== maxValue) {
                    identityLine.push([maxValue, maxValue]);
                }

                const series = [
                    {
                        name: "x = y",
                        type: "line",
                        data: identityLine,
                        symbol: "none",
                        silent: true,
                        animation: false,
                        lineStyle: {
                            color: tokens.line.reference,
                            width: 1,
                            type: "dashed",
                        },
                        z: 0,
                    },
                    ...(regression ? [{
                        name: "Regression",
                        type: "line",
                        data: regression.points,
                        symbol: "none",
                        silent: true,
                        animation: false,
                        lineStyle: {
                            color: tokens.series[0],
                            width: 2,
                        },
                        z: 1,
                    }] : []),
                    {
                        name: run,
                        type: "scatter",
                        symbol: "circle",
                        symbolSize: 6,

                        itemStyle: {
                            color: tokens.ink.strong,
                            opacity: 0.7,
                        },

                        emphasis: {
                            scale: true,
                            itemStyle: {
                                opacity: 1,
                                borderColor: tokens.ink.strong,
                                borderWidth: 1,
                            },
                        },

                        data: points,
                        z: 2,
                    },
                ]

                const options = {
                    title: {
                        text: `${run}: CC½ resolution, A vs B`,
                        left: "center",
                    },

                        graphic: summaryBoxGraphic(regressionSummary),

                    tooltip: {
                        trigger: "item",
                        axisPointer: {
                            type: "cross",
                        },
                        formatter: params => {
                            const d = params.data;

                            return `
                                <b>${d.label}</b><br/>
                                A: ${formatD(d.A)} Å<br/>
                                B: ${formatD(d.B)} Å
                            `;
                        },
                    },

                    xAxis: {
                        type: "value",
                        name: "A (Å)",
                        nameLocation: "middle",
                        nameGap: 30,
                        nameTextStyle: {
                            color: tokens.variant.A,
                            fontWeight: 600,
                        },
                        min: 0,
                        max: maxValue,
                        scale: true,
                        axisLabel: { formatter: formatD },
                    },

                    yAxis: {
                        type: "value",
                        name: "B (Å)",
                        nameLocation: "middle",
                        nameGap: 40,
                        nameRotate: 90,
                        nameTextStyle: {
                            color: tokens.variant.B,
                            fontWeight: 600,
                        },
                        min: 0,
                        max: maxValue,
                        scale: true,
                        axisLabel: { formatter: formatD },
                    },

                    grid: {
                        containLabel: true,
                    },

                    dataZoom: STANDARD_DATA_ZOOM,

                    series
                };

                return (
                    <Chart
                        key={run}
                        option={options}
                        notMerge
                        lazyUpdate
                        style={chartStyle}
                    />
                );
            })}
        </div>
    );
}

export default CC_halfOverallChart;
