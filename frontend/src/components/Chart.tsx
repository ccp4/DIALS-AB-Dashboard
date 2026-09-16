/**
 * Wraps `<ReactECharts>` with the registered "dials" theme forced on.
 * Props pass straight through.
 */

import ReactECharts from "echarts-for-react";
import type { ComponentProps } from "react";

import "../theme/echartsTheme";

function Chart(props: ComponentProps<typeof ReactECharts>) {
    return <ReactECharts {...props} theme="dials" />;
}

export default Chart;
