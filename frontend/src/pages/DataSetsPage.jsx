import ChartCard from "../components/ChartCard"
import { Button, Grid } from "@mui/material"
import RawDataChart from "../components/RawDataChart";
import { useState } from "react";
import RunSelector from "../components/RunSelector";

export default function DataSetsPage(){
	const [selectedRun, setSelectedRun] = useState("");

	return(
		<>

			<RunSelector
				value={selectedRun}
				onChange={setSelectedRun}
			/>

			{ selectedRun &&(
				<Grid container spacing={2}>

					<Grid xs={12} md={6} lg={4}>
						<ChartCard>
							<RawDataChart typeOfData="raw" run={selectedRun} />
						</ChartCard>
					</Grid>

					<Grid xs={12} md={6} lg={4}>
						<ChartCard>
							<RawDataChart typeOfData="comparison" run={selectedRun}/>
						</ChartCard>
					</Grid>

				</Grid>
			)}

		</>
	)
}