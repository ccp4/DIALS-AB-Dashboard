import { Box, CircularProgress, Typography } from "@mui/material";

interface LoadingStateProps {
    label?: string;
}

/** The dashboard's one loading indicator. */
function LoadingState({ label = "Loading..." }: LoadingStateProps) {
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
