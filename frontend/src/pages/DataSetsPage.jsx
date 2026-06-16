import ChartCard from "../components/ChartCard"
import { Button, Grid } from "@mui/material"
import RawDataChart from "../components/RawDataChart";
import { useState } from "react";
import RunSelector from "../components/RunSelector";

export default function DataSetsPage(){
	const [selectedRuns, setSelectedRuns] = useState([]);

	return(
		<>

			<RunSelector
				value={selectedRuns}
				onChange={setSelectedRuns}
			/>

			{selectedRuns.length > 0 && (
				<Grid container spacing={2}>
					{selectedRuns.map((selectedRun) => (
					<>
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
					</>
					))}
				</Grid>	
			)}
		</>
	)
}