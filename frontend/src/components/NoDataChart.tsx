import type { CSSProperties } from "react";
import Chart from "./Chart";
import { noDataGraphic } from "../theme/chartChrome";

interface NoDataChartProps {
    title: string;
    message?: string;
    style?: CSSProperties;
}

/** A Chart-shaped placeholder for a panel with nothing to plot */
function NoDataChart({ title, message, style }: NoDataChartProps) {
    return (
        <Chart
            option={{
                title: { text: title, left: "center" },
                graphic: noDataGraphic(message),
            }}
            style={style}
        />
    );
}

export default NoDataChart;
