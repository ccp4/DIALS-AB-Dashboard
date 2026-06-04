import ChartCard from "../components/ChartCard"
import { Button, Grid } from "@mui/material"
import RawDataChart from "../components/RawDataChart";
import { useState } from "react";

export default function DataSetsPage(){

	return(
		<>
			<Grid container spacing={2}>

				<Grid xs={12} md={6} lg={4}>
					<ChartCard>
						<RawDataChart typeOfData="raw" />
					</ChartCard>
				</Grid>

				<Grid xs={12} md={6} lg={4}>
					<ChartCard>
						<RawDataChart typeOfData="comparison" />
					</ChartCard>
				</Grid>

			</Grid>

		</>
	)
}