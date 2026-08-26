import { IconButton } from "@mui/material";
import { useNavigate } from "react-router-dom";

/** A grey arrow that navigates back one step in browser history. */
export default function BackButton() {
    const navigate = useNavigate();

    return (
        <IconButton onClick={() => navigate(-1)} aria-label="Back" sx={{ color: "grey.500", fontSize: "1.5rem" }}>
            ←
        </IconButton>
    );
}
