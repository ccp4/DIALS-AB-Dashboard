import ChartCard from "../components/ChartCard"
import { Grid } from "@mui/material"
import MemoryABChart from "../components/MemoryABChart";
import MemoryComparisonChart from "../components/MemoryComparisonChart";
import ResolutionChecker from "../components/ResolutionChecker"
import RunSelector from "../components/RunSelector";
import { useState, useEffect } from "react";

export default function OverViewPage(){
	const [selectedRuns, setSelectedRuns] = useState([]);
	const [memoryData, setMemoryData] = useState({});
    const [loading, setLoading] = useState(false);
	const apiURL = "http://localhost:8000";

	useEffect(() => {
        if (!selectedRuns.length) {
            setMemoryData({});
            return;
        }
        setLoading(true);
        Promise.all(
            selectedRuns.map(run =>
                fetch(`${apiURL}/runs/${run}/memory`)
                    .then(res => res.json())
                    .then(data => ({
                        run,
                        data
                    }))
            )
        )
        .then(results => {
            const mapped = {};
            results.forEach(({ run, data }) => {
                mapped[run] = data;
            });
            setMemoryData(mapped);
        })
        .catch(err => {
            console.log(err.message);
        })
        .finally(() => {
            setLoading(false);
        });
    }, [selectedRuns]);



	return(
		<>
			<RunSelector
				value={selectedRuns}
				onChange={setSelectedRuns}
			/>

            {loading && (
                <p>Loading...</p>
            )}

            {!loading && selectedRuns.length > 0 && (
				<>
					<MemoryComparisonChart
						data={memoryData}
					/>

					<MemoryABChart
						data={memoryData}
					/>
				</>
            )}

        </>
	)
}