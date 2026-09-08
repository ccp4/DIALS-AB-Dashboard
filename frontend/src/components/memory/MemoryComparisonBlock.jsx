import { useState } from "react";
import { Box, ToggleButton, ToggleButtonGroup } from "@mui/material";
import MemoryOverlayChart from "./MemoryOverlayChart";
import MemoryRankChart from "./MemoryRankChart";

// Teal bar chrome (tokens.brand.primary via the MUI theme's "primary" palette)
// needs its own toggle styling — the default outlined look assumes a plain
// background, not a solid colour bar. A fixed width keeps the bar's shape
// stable as labels change.
const TOGGLE_ON_BAR_SX = {
    "& .MuiToggleButton-root": {
        color: "primary.contrastText",
        bgcolor: "primary.dark",
        borderColor: "rgba(255, 255, 255, 0.3)",
        minWidth: 110,
        borderRadius: 2,
        "&:hover": { bgcolor: "primary.dark" },
    },
    "& .MuiToggleButton-root.Mui-selected": {
        color: "primary.main",
        bgcolor: "primary.contrastText",
        "&:hover": { bgcolor: "primary.contrastText" },
    },
};

function MemoryComparisonBlock({ data }) {
    const [mode, setMode] = useState("diff");
    const [unit, setUnit] = useState("absolute");
    const [ranking, setRanking] = useState("independent");

    return (
        <Box>
            <Box
                sx={{
                    mb: 1,
                    px: 2,
                    py: 0.75,
                    borderRadius: 3,
                    bgcolor: "primary.main",
                    display: "flex",
                    justifyContent: "space-between",
                    flexWrap: "wrap",
                    gap: 1,
                }}
            >
                <ToggleButtonGroup
                    value={mode}
                    exclusive
                    size="small"
                    sx={TOGGLE_ON_BAR_SX}
                    onChange={(event, next) => next && setMode(next)}
                >
                    <ToggleButton value="ab">A, B</ToggleButton>
                    <ToggleButton value="diff">A − B</ToggleButton>
                </ToggleButtonGroup>

                {mode === "ab" ? (
                    <ToggleButtonGroup
                        value={ranking}
                        exclusive
                        size="small"
                        sx={TOGGLE_ON_BAR_SX}
                        onChange={(event, next) => next && setRanking(next)}
                    >
                        <ToggleButton value="independent">Independent</ToggleButton>
                        <ToggleButton value="matched">Matched to A</ToggleButton>
                    </ToggleButtonGroup>
                ) : (
                    <ToggleButtonGroup
                        value={unit}
                        exclusive
                        size="small"
                        sx={TOGGLE_ON_BAR_SX}
                        onChange={(event, next) => next && setUnit(next)}
                    >
                        <ToggleButton value="absolute">MiB</ToggleButton>
                        <ToggleButton value="percent">%</ToggleButton>
                    </ToggleButtonGroup>
                )}
            </Box>

            {mode === "ab"
                ? <MemoryRankChart data={data} ranking={ranking} />
                : <MemoryOverlayChart data={data} unit={unit} />}
        </Box>
    )
}

export default MemoryComparisonBlock;