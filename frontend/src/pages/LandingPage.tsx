import { AppBar, Box, Button, Stack, Toolbar, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";

const DESTINATIONS = [
    {
        label: "Memory Usage",
        icon: "💾",
        path: "/memory",
        description: "Peak memory and cumulative runtime across selected runs.",
    },
    {
        label: "Data Quality",
        icon: "🔬",
        path: "/datasets",
        description: "Per-run resolution and merging-stats charts.",
    },
    {
        label: "Explore",
        icon: "🧭",
        path: "/explore",
        description: "Cohort overview and per-sample A/B detail for one run.",
    },
];

export default function LandingPage() {
    const navigate = useNavigate();

    return (
        <>
            <AppBar position="fixed" color="secondary">
                <Toolbar>
                    <Typography variant="h6">DIALS A-B Dashboard</Typography>
                </Toolbar>
            </AppBar>

            <Toolbar />

            <Box
                sx={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    minHeight: "calc(100vh - 64px)",
                }}
            >
                <Stack direction="row" spacing={4} useFlexGap sx={{ px: 3, justifyContent: "center", flexWrap: "wrap" }}>
                    {DESTINATIONS.map((d) => (
                        <Box key={d.path} sx={{ textAlign: "center", width: 260 }}>
                            <Button
                                variant="contained"
                                fullWidth
                                onClick={() => navigate(d.path)}
                                sx={{
                                    flexDirection: "column",
                                    gap: 1,
                                    py: 4,
                                    fontSize: "1.1rem",
                                }}
                            >
                                <span style={{ fontSize: "2.5rem" }}>{d.icon}</span>
                                {d.label}
                            </Button>
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>
                                {d.description}
                            </Typography>
                        </Box>
                    ))}
                </Stack>
            </Box>
        </>
    );
}
