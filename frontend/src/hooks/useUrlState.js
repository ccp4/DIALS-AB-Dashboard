import { useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";

/**
 * Selection state held in the query string so a view can be linked to.
 *
 * Writes use `replace`, so building up a selection leaves one history entry
 * rather than one per keystroke; the back button leaves the view instead of
 * unwinding the selection.
 *
 * Each hook call wraps its own `useSearchParams()`, so calling setters from
 * two different hook instances synchronously in the same handler is a race
 * — both read the same pre-render snapshot, so the second call's write
 * silently drops the first's. Use `useSearchParams` directly for one
 * `setSearchParams` call that updates multiple keys atomically instead
 * (`encodeParamMap` is exported for exactly this — see `RunMetricPanel`'s
 * `handleSyncToggle`).
 */

const EMPTY = [];
const EMPTY_MAP = {};

/**
 * A single string parameter.
 *
 * @param {string} key Query-string parameter name.
 * @param {string|null} [fallback] Returned when the parameter is absent.
 * @returns {[string|null, (next: string|null) => void]} Setting `null` or `""`
 *          removes the parameter rather than writing an empty value.
 */
export function useUrlParam(key, fallback = null) {
    const [params, setParams] = useSearchParams();

    const setValue = useCallback(next => {
        setParams(prev => {
            const updated = new URLSearchParams(prev);

            if (next == null || next === "") updated.delete(key);
            else updated.set(key, next);

            return updated;
        }, { replace: true });
    }, [key, setParams]);

    return [params.get(key) ?? fallback, setValue];
}

/**
 * A comma-joined list parameter, for multi-select controls.
 *
 * Values must not contain commas. Run and dataset ids are directory names from
 * the workspace, which never do.
 *
 * @param {string} key Query-string parameter name.
 * @returns {[string[], (next: string[]) => void]} The array identity is stable
 *          while the URL is unchanged, so it is safe to pass straight into an
 *          effect dependency or `useApiAll`.
 */
export function useUrlParamList(key) {
    const [params, setParams] = useSearchParams();

    const raw = params.get(key);

    const value = useMemo(
        () => (raw ? raw.split(",").filter(Boolean) : EMPTY),
        [raw]
    );

    const setValue = useCallback(next => {
        setParams(prev => {
            const updated = new URLSearchParams(prev);

            if (next?.length) updated.set(key, next.join(","));
            else updated.delete(key);

            return updated;
        }, { replace: true });
    }, [key, setParams]);

    return [value, setValue];
}

/**
 * A `key:value` comma-joined map parameter, for per-item selections keyed by a
 * dynamic set of ids (e.g. one dataset choice per selected run).
 *
 * Keys and values must not contain commas or colons — true for run ids and
 * dataset names, which are workspace directory names.
 *
 * @param {string} key Query-string parameter name.
 * @returns {[Object<string,string>, (next: Object<string,string>) => void]}
 *          `setValue` takes the full next map, mirroring `useUrlParamList`
 *          rather than a `useState`-style updater.
 */
/**
 * The `key:value,...` encoding `useUrlParamMap` uses, exposed so a caller
 * that needs to write this param atomically alongside another one (via a
 * single `setSearchParams` call — see its docstring for why) doesn't have
 * to duplicate the format.
 *
 * @returns {string|null} `null` means "remove the param".
 */
export function encodeParamMap(map) {
    const entries = Object.entries(map ?? {}).filter(([, v]) => v != null && v !== "");
    return entries.length ? entries.map(([k, v]) => `${k}:${v}`).join(",") : null;
}

export function useUrlParamMap(key) {
    const [params, setParams] = useSearchParams();

    const raw = params.get(key);

    const value = useMemo(() => {
        if (!raw) return EMPTY_MAP;

        return Object.fromEntries(
            raw.split(",").filter(Boolean).map(pair => pair.split(":"))
        );
    }, [raw]);

    const setValue = useCallback(next => {
        setParams(prev => {
            const updated = new URLSearchParams(prev);
            const encoded = encodeParamMap(next);

            if (encoded) updated.set(key, encoded);
            else updated.delete(key);

            return updated;
        }, { replace: true });
    }, [key, setParams]);

    return [value, setValue];
}
