import ChartCard from "../components/ChartCard"
import { Grid } from "@mui/material"
import dataJSON from "../data.json";
import ExplorerChart from "../components/ExplorerChart";

export default function DataSetsPage(){
	return(
		<>
			<Grid container spacing={2}>
		
				<Grid xs={12} md={6} lg={4}>
					<ChartCard>
						<ExplorerChart dataJSON={dataJSON} />
					</ChartCard>
				</Grid>

			</Grid>
		</>
	)
}