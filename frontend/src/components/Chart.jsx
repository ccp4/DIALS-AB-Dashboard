/**
 * Every ECharts chart in the dashboard renders through here.
 *
 * It exists so the registered "dials" theme cannot be forgotten. A chart that
 * imports `echarts-for-react` directly falls back to the ECharts default
 * palette without erroring, and nothing lints that — the failure is a chart
 * that merely looks wrong. Registration is imported here rather than in
 * `main.jsx` so it travels with the only thing that needs it.
 *
 * Props pass straight through to `<ReactECharts>`.
 */

import ReactECharts from "echarts-for-react";

import "../theme/echartsTheme";

function Chart(props) {
    return <ReactECharts theme="dials" {...props} />;
}

export default Chart;
