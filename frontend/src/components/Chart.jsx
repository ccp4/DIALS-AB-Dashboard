/**
 * Wraps `<ReactECharts>` with the registered "dials" theme forced on.
 * Props pass straight through.
 */

import ReactECharts from "echarts-for-react";

import "../theme/echartsTheme";

function Chart(props) {
    return <ReactECharts {...props} theme="dials" />;
}

export default Chart;
