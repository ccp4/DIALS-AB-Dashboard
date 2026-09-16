import DatasetChart from "./DatasetChart";
import DatasetSelector from "../DatasetSelector";
import { useDatasetResource } from "../../hooks/useRunsApi";

interface RunPanelProps {
    runId?: string;
    metric: string;
    dataset?: string | null;
    onDatasetChange: (dataset: string | null) => void;
    single?: boolean;
}

function RunPanel({ runId, metric, dataset, onDatasetChange, single }: RunPanelProps) {

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
                single={single}
            />
        </>
    );
}

export default RunPanel;