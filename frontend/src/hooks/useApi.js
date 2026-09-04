import { useEffect, useRef, useState } from "react";
import { useErrorBoundary } from "react-error-boundary";
import { apiGet } from "../api/client";

/**
 * The dashboard's one data-fetching idiom.
 *
 * Both hooks abort the in-flight request when their inputs change or the
 * component unmounts, and both escalate failures to the nearest
 * `ErrorBoundary` by default — without that, a dead backend leaves a component
 * on "Loading…" forever, because boundaries do not catch async errors.
 *
 * `useErrorBoundary` throws if there is no boundary above the caller, so any
 * component using these hooks must be rendered inside one. `App.jsx` wraps
 * every route, which covers the whole tree.
 */

/**
 * Fetch a single resource.
 *
 * @param {string|null} path Absolute path, or `null` to fetch nothing — use
 *        this for a resource that depends on a selection not yet made, rather
 *        than calling the hook conditionally.
 * @param {{throwOnError?: boolean}} [options] Set `throwOnError: false` to
 *        handle the failure inline instead of escalating to the boundary.
 * @returns {{data: any, loading: boolean, error: Error|null}}
 */
export function useApi(path, { throwOnError = true } = {}) {
    const { showBoundary } = useErrorBoundary();

    const [settled, setSettled] = useState({ path: null, data: null, error: null });

    useEffect(() => {
        if (path == null) return;

        const controller = new AbortController();

        apiGet(path, { signal: controller.signal })
            .then(data => setSettled({ path, data, error: null }))
            .catch(error => {
                if (controller.signal.aborted) return;

                setSettled({ path, data: null, error });
                if (throwOnError) showBoundary(error);
            });

        return () => controller.abort();
    }, [path, throwOnError, showBoundary]);

    // Loading is derived rather than stored: state carries the path it belongs
    // to, so a changed path reads as loading on the same render that changed it
    // and never briefly shows the previous path's data.
    if (settled.path !== path) {
        return { data: null, loading: path != null, error: null };
    }

    return { data: settled.data, loading: false, error: settled.error };
}

/**
 * Fetch several resources together and return them as a keyed map.
 *
 * Responses are cached by path for the lifetime of the component, so adding a
 * run to a selection fetches only that run and deselecting one drops it from
 * the result without discarding its data. The returned map contains exactly
 * the keys in `requests`, so pruning is a consequence of the projection rather
 * than a second effect.
 *
 * The effect keys off `JSON.stringify(requests)` and parses it back, so a new
 * array with identical contents does not refetch and the effect can never read
 * a `requests` value that disagrees with the dependency that triggered it.
 *
 * @param {Array<{key: string, path: string}>} requests
 * @param {{throwOnError?: boolean}} [options]
 * @returns {{data: Object<string, any>, loading: boolean, error: Error|null}}
 */
export function useApiAll(requests, { throwOnError = true } = {}) {
    const { showBoundary } = useErrorBoundary();

    const cache = useRef(new Map());

    const [data, setData] = useState({});
    const [loading, setLoading] = useState(requests.length > 0);
    const [error, setError] = useState(null);

    const key = JSON.stringify(requests);

    useEffect(() => {
        const wanted = JSON.parse(key);

        const project = () => Object.fromEntries(
            wanted
                .filter(({ path }) => cache.current.has(path))
                .map(({ key: name, path }) => [name, cache.current.get(path)])
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
                apiGet(path, { signal: controller.signal }).then(value => ({ path, value }))
            )
        )
            .then(results => {
                if (controller.signal.aborted) return;

                // A failed request in the batch must not discard the others'
                // results — cache every fulfilled one, then surface the first
                // rejection (if any) without blocking on it.
                let firstError = null;

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
