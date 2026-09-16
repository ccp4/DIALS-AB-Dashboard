import { ErrorBoundary as ReactErrorBoundary } from "react-error-boundary";
import type { FallbackProps, ErrorBoundaryPropsWithRender } from "react-error-boundary";
import { Alert, AlertTitle, Box, Button } from "@mui/material";
import type { ReactNode } from "react";

interface DialsFallbackProps extends FallbackProps {
    label?: string;
}

function Fallback({ label, error, resetErrorBoundary }: DialsFallbackProps) {
    // Boundaries here only ever catch a thrown Error/ApiError
    const err = error as Error & { status?: number };

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
                {err.message}
                {err.status === 0 && (
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

interface ErrorBoundaryProps extends Partial<Omit<ErrorBoundaryPropsWithRender, "fallbackRender">> {
    label?: string;
    children: ReactNode;
}

/**
 * Wraps `react-error-boundary` with the dashboard's fallback UI. Catches
 * render errors only — forward event-handler/effect/promise errors by hand
 * via the library's `useErrorBoundary()` hook.
 */
export default function ErrorBoundary({ label, children, ...props }: ErrorBoundaryProps) {
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
