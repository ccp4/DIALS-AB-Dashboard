import Chart from "./Chart";
import { tokens } from "../theme/tokens";

/**
 * A Chart-shaped placeholder for a panel with nothing to plot — keeps the
 * panel's title/size/position identical to a real chart, so a grid of
 * per-run panels doesn't reflow just because one run has no comparable data.
 */
function NoDataChart({ title, message, style }) {
    return (
        <Chart
            option={{
                title: { text: title, left: "center" },
                graphic: [{
                    type: "text",
                    left: "center",
                    top: "middle",
                    style: {
                        text: message,
                        fill: tokens.ink.muted,
                        font: `${tokens.font.size.label}px ${tokens.font.family}`,
                    },
                }],
            }}
            style={style}
        />
    );
}

export default NoDataChart;
