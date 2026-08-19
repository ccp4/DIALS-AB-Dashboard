import { Box, CircularProgress, Typography } from "@mui/material";

/**
 * The dashboard's one loading indicator, so "still fetching" reads the same
 * way everywhere instead of as seven different ad-hoc strings.
 */
function LoadingState({ label = "Loading..." }) {
    return (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, py: 1 }}>
            <CircularProgress size={16} />
            <Typography variant="body2" color="text.secondary">
                {label}
            </Typography>
        </Box>
    );
}

export default LoadingState;
