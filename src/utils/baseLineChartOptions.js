export const baseLineChartOptions = {
	toolbox: {
		right: 20,
		top: 50,
		feature: {
			dataZoom: { yAxisIndex: "none" },
			restore: {},
			saveAsImage: {},
		},
	},

	grid: {
		top: 110,
		left: 60,
		right: 120,
		bottom: 120,
	},

	legend: {
		orient: "vertical",
		right: 20,
		top: "center",
	},

	dataZoom: [{ type: "inside" }, { type: "slider" }],

	xAxis: { type: "value" },
	yAxis: { type: "value" },
};