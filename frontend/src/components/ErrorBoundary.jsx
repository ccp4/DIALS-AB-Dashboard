import { ErrorBoundary as ReactErrorBoundary } from "react-error-boundary";
import { Alert, AlertTitle, Box, Button } from "@mui/material";

function Fallback({ label, error, resetErrorBoundary }) {
    return (
        <Box sx={{ p: 2 }}>
            <Alert
                severity="error"
                action={
                    <Button color="inherit" size="small" onClick={resetErrorBoundary}>
                        Retry
                    </Button>
                }
            >
                <AlertTitle>
                    {label ? `${label} failed to render` : "Something went wrong"}
                </AlertTitle>
                {error.message}
                {error.status === 0 && (
                    <Box sx={{ mt: 1 }}>
                        A network-level failure looks the same whether the backend is down or CORS
                        is misconfigured. Check the backend is running, and that <code>VITE_API_URL</code>
                        {" "}and <code>FRONTEND_URL</code> are set to match each other.
                    </Box>
                )}
            </Alert>
        </Box>
    );
}

/**
 * Wraps `react-error-boundary` with the dashboard's fallback UI.
 *
 * Catches errors thrown during render only — errors in event handlers, in
 * `useEffect` callbacks and in promise rejections are not caught. Use the
 * library's `useErrorBoundary()` hook to forward those.
 *
 * @param {string}   [label]     Names the failing component in the alert and the console.
 * @param {any[]}    [resetKeys] Clears the error when any entry changes. Pass the selected
 *                               run(s) so changing selection retries. Forwarded to
 *                               `react-error-boundary`, as is any other prop.
 * @param {React.ReactNode} children
 */
export default function ErrorBoundary({ label, children, ...props }) {
    return (
        <ReactErrorBoundary
            fallbackRender={({ error, resetErrorBoundary }) => (
                <Fallback
                    label={label}
                    error={error}
                    resetErrorBoundary={resetErrorBoundary}
                />
            )}
            onError={(error, info) =>
                console.error(`[${label ?? "ErrorBoundary"}]`, error, info)
            }
            {...props}
        >
            {children}
        </ReactErrorBoundary>
    );
}
