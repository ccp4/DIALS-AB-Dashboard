import ChartCard from "../components/ChartCard"
import { Grid } from "@mui/material"
import MemoryABChart from "../components/MemoryABChart";
import MemoryComparisonChart from "../components/MemoryComparisonChart";
import CC_halfChart from "../components/CC_halfChart";
import ResolutionChecker from "../components/ResolutionChecker"
import RunSelector from "../components/RunSelector";
import { useState } from "react";

export default function OverViewPage(){
	const [selectedRun, setSelectedRun] = useState("");

	return(
		<>
			<RunSelector
				value={selectedRun}
				onChange={setSelectedRun}
			/>
			{ selectedRun && (
				<Grid container spacing={2}>

					<Grid xs={12} md={6} lg={4}>
						<ChartCard>
							<MemoryComparisonChart run={selectedRun} />
						</ChartCard>
					</Grid>

					<Grid xs={12} md={6} lg={4}>
						<ChartCard>
							<MemoryABChart run={selectedRun} />
						</ChartCard>
					</Grid>

				</Grid>
			)}
		</>
	)
}