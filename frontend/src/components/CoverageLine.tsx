import { Tooltip, Typography } from "@mui/material";
import type { SxProps, Theme } from "@mui/material";

interface Coverage {
  complete: number;
  total: number;
  missing_a: number;
  missing_b: number;
}

interface CoverageLineProps {
  coverage: Coverage;
  missingA: string[];
  missingB: string[];
  prefix?: string;
  sx?: SxProps<Theme>;
}

/** The "N / M complete · X missing A · Y missing B" line with a hover tooltip listing the missing names. */
function CoverageLine({ coverage, missingA, missingB, prefix, sx }: CoverageLineProps) {
    return (
        <Typography variant="body2" color="text.secondary" sx={sx}>
            {prefix}
            {coverage.complete} / {coverage.total} complete
            {coverage.missing_a > 0 && ` · ${coverage.missing_a} missing A`}
            {coverage.missing_b > 0 && ` · ${coverage.missing_b} missing B`}
            {(missingA.length > 0 || missingB.length > 0) && (
                <Tooltip
                    title={
                        <>
                            {missingA.length > 0 && <div>Missing A: {missingA.join(", ")}</div>}
                            {missingB.length > 0 && <div>Missing B: {missingB.join(", ")}</div>}
                        </>
                    }
                >
                    <span style={{ cursor: "help" }}> ⓘ</span>
                </Tooltip>
            )}
        </Typography>
    );
}

export default CoverageLine;
