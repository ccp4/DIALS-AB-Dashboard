import ChartCard from "../components/ChartCard"
import { Grid } from "@mui/material"
import dataJSON from "../data.json";
import MemoryABChart from "../components/MemoryABChart";
import MemoryComparisonChart from "../components/MemoryComparisonChart";
import CC_halfChart from "../components/CC_halfChart";
import ResolutionChecker from "../components/ResolutionChecker"

export default function OverViewPage(){
	return(
		<>
			<Grid container spacing={2}>

				<Grid xs={12} md={6} lg={4}>
					<ChartCard>
						<MemoryComparisonChart/>
					</ChartCard>
				</Grid>

				<Grid xs={12} md={6} lg={4}>
					<ChartCard>
						<MemoryABChart/>
					</ChartCard>
				</Grid>

				<Grid xs={12} md={6} lg={4}>
					<ChartCard>
						<CC_halfChart dataJSON={dataJSON} />
					</ChartCard>
				</Grid>

				<Grid xs={12} md={6} lg={4}>
					<ChartCard>
						<ResolutionChecker dataJSON={dataJSON} />
					</ChartCard>
				</Grid>



			</Grid>
		</>
	)
}