import ChartCard from "../components/ChartCard"
import { Grid } from "@mui/material"
import dataJSON from "../data.json";
import MemoryChart from "../components/MemoryChart";
import CC_halfChart from "../components/CC_halfChart";
import ResolutionChecker from "../components/ResolutionChecker"

export default function OverViewPage(){
	return(
		<>
			<Grid container spacing={2}>
		
				<Grid xs={12} md={6} lg={4}>
					<ChartCard>
						<MemoryChart dataJSON={dataJSON} />
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