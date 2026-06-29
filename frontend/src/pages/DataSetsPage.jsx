import RawDataChart from "../components/RawDataChart";
import { useState, useEffect } from "react";
import RunSelector from "../components/RunSelector";
import { Card, CardContent, Typography, Grid } from "@mui/material";

export default function DataSetsPage() {
    const [selectedRuns, setSelectedRuns] = useState([]);
    const [rawData, setRawData] = useState({});
    const [comparisonData, setComparisonData] = useState({});
    const [loading, setLoading] = useState(false);
    const apiURL = "http://localhost:8000";


    useEffect(() => {
        setRawData(prev =>
            Object.fromEntries(
                selectedRuns
                    .filter(run => prev[run])
                    .map(run => [run, prev[run]])
            )
        );

        setComparisonData(prev =>
            Object.fromEntries(
                selectedRuns
                    .filter(run => prev[run])
                    .map(run => [run, prev[run]])
            )
        );
    }, [selectedRuns]);

    useEffect(() => {
        async function fetchMissingRuns() {

            const missingRuns = selectedRuns.filter(
                run => !rawData[run]
            );

            if (!missingRuns.length) {
                return;
            }


            setLoading(true);

            try {

                const rawResults = await Promise.all(
                    missingRuns.map(async run => {
                        const res = await fetch(
                            `${apiURL}/runs/${run}/raw`
                        );

                        return {
                            run,
                            data: await res.json()
                        };
                    })
                );


                const comparisonResults = await Promise.all(
                    missingRuns.map(async run => {
                        const res = await fetch(
                            `${apiURL}/runs/${run}/comparison`
                        );

                        return {
                            run,
                            data: await res.json()
                        };
                    })
                );


                setRawData(prev => ({
                    ...prev,
                    ...Object.fromEntries(
                        rawResults.map(({ run, data }) => [
                            run,
                            data
                        ])
                    )
                }));


                setComparisonData(prev => ({
                    ...prev,
                    ...Object.fromEntries(
                        comparisonResults.map(({ run, data }) => [
                            run,
                            data
                        ])
                    )
                }));


            } catch (err) {
                console.log(err.message);
            }
            finally {
                setLoading(false);
            }
        }


        fetchMissingRuns();

    }, [selectedRuns, rawData]);

    return (
        <>
            <RunSelector
                value={selectedRuns}
                onChange={setSelectedRuns}
            />


            {loading && (
                <p>Loading...</p>
            )}


			{selectedRuns.map(run => {

				if (!rawData[run] || !comparisonData[run]) {
					return null;
				}

				return (
					<Card
						key={run}
						sx={{
							marginBottom: 3,
							padding: 2
						}}
					>
						<CardContent>

							<Typography variant="h5" gutterBottom>
								{run}
							</Typography>


							<Grid container spacing={2}>

								<Grid item xs={12} md={6}>
									<Typography variant="h6">
										Raw Data
									</Typography>

									<RawDataChart
										data={rawData[run]}
									/>
								</Grid>


								<Grid item xs={12} md={6}>
									<Typography variant="h6">
										Comparison Metrics
									</Typography>

									<RawDataChart
										data={comparisonData[run]}
									/>
								</Grid>

							</Grid>

						</CardContent>
					</Card>
				);
			})}
        </>
    );
}