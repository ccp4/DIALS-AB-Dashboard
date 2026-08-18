import DatasetChart from "./DatasetChart";
import DatasetSelector from "./DatasetSelector";
import { useDatasetResource } from "./useDatasetResource";

function RunPanel({ runId, metric, dataset, onDatasetChange }) {

    const {
        data,
        loading,
        error
    } = useDatasetResource(runId, dataset, metric);

    return (
        <>
            <DatasetSelector
                runId={runId}
                value={dataset}
                onChange={onDatasetChange}
            />

            <DatasetChart
                runId={runId}
                dataset={dataset}
                data={data}
            />
        </>
    );
}

export default RunPanel;