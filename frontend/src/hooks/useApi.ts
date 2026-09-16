import { useEffect, useRef, useState } from "react";
import { useErrorBoundary } from "react-error-boundary";
import { apiGet } from "../api/client";

/**
 * The dashboard's one data-fetching idiom. Aborts the in-flight request on
 * input change or unmount; escalates failures to the nearest `ErrorBoundary`
 * by default (React boundaries don't catch async errors on their own).
 * Requires an `ErrorBoundary` above the caller — `App.jsx` wraps every route.
 */

export interface UseApiOptions {
    /** `false` handles the failure inline instead of escalating to the boundary. */
    throwOnError?: boolean;
}

interface Settled<T> {
    path: string | null;
    data: T | null;
    error: Error | null;
}

/** Fetches one resource. `path: null` skips the fetch. */
export function useApi<T = unknown>(path: string | null, { throwOnError = true }: UseApiOptions = {}) {
    const { showBoundary } = useErrorBoundary();

    const [settled, setSettled] = useState<Settled<T>>({ path: null, data: null, error: null });

    useEffect(() => {
        if (path == null) return;

        const controller = new AbortController();

        apiGet<T>(path, { signal: controller.signal })
            .then(data => setSettled({ path, data, error: null }))
            .catch(error => {
                if (controller.signal.aborted) return;

                setSettled({ path, data: null, error });
                if (throwOnError) showBoundary(error);
            });

        return () => controller.abort();
    }, [path, throwOnError, showBoundary]);

    // `loading` is derived, not stored: true whenever `path` hasn't settled yet.
    if (settled.path !== path) {
        return { data: null, loading: path != null, error: null };
    }

    return { data: settled.data, loading: false, error: settled.error };
}

/** Fetches several resources and returns them as a keyed map, cached by path for the component's lifetime. */
export interface ApiRequest {
    key: string;
    path: string;
}

export function useApiAll<T = unknown>(requests: ApiRequest[], { throwOnError = true }: UseApiOptions = {}) {
    const { showBoundary } = useErrorBoundary();

    const cache = useRef(new Map<string, T>());

    const [data, setData] = useState<Record<string, T>>({});
    const [loading, setLoading] = useState(requests.length > 0);
    const [error, setError] = useState<Error | null>(null);

    const key = JSON.stringify(requests);

    useEffect(() => {
        const wanted: ApiRequest[] = JSON.parse(key);

        const project = (): Record<string, T> => Object.fromEntries(
            wanted
                .filter(({ path }) => cache.current.has(path))
                .map(({ key: name, path }) => [name, cache.current.get(path)!])
        );

        setData(project());

        const missing = wanted.filter(({ path }) => !cache.current.has(path));

        if (!missing.length) {
            setLoading(false);
            setError(null);
            return;
        }

        const controller = new AbortController();

        setLoading(true);
        setError(null);

        Promise.allSettled(
            missing.map(({ path }) =>
                apiGet<T>(path, { signal: controller.signal }).then(value => ({ path, value }))
            )
        )
            .then(results => {
                if (controller.signal.aborted) return;

                // Caches every fulfilled result, then surfaces the first rejection (if any).
                let firstError: Error | null = null;

                results.forEach(result => {
                    if (result.status === "fulfilled") {
                        cache.current.set(result.value.path, result.value.value);
                    } else if (!firstError) {
                        firstError = result.reason;
                    }
                });

                setData(project());
                setLoading(false);
                setError(firstError);

                if (firstError && throwOnError) showBoundary(firstError);
            });

        return () => controller.abort();
    }, [key, throwOnError, showBoundary]);

    return { data, loading, error };
}
