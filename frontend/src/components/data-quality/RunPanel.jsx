import DatasetChart from "./DatasetChart";
import DatasetSelector from "./DatasetSelector";
import { useDatasetResource } from "./useDatasetResource";

function RunPanel({ runId, metric, dataset, onDatasetChange }) {

    const { data } = useDatasetResource(runId, dataset, metric);

    return (
        <>
            <DatasetSelector
                runId={runId}
                value={dataset}
                onChange={onDatasetChange}
            />

            <DatasetChart
                data={data}
                urlKey={`${metric}_${runId}`}
            />
        </>
    );
}

export default RunPanel;