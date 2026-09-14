import { useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";

/**
 * Selection state held in the query string. Writes use `replace`, not push.
 * Each hook call wraps its own `useSearchParams()` — setters from two
 * different hook instances called synchronously in the same handler race and
 * one write is dropped. Use `useSearchParams` directly with `encodeParamMap`
 * for one atomic multi-key update instead (see `RunMetricPanel.handleSyncToggle`).
 */

const EMPTY: string[] = [];
const EMPTY_MAP: Record<string, string> = {};

/** A single string parameter. `null`/`""` removes it. */
export function useUrlParam(key: string, fallback: string | null = null): [string | null, (next: string | null) => void] {
    const [params, setParams] = useSearchParams();

    const setValue = useCallback((next: string | null) => {
        setParams(prev => {
            const updated = new URLSearchParams(prev);

            if (next == null || next === "") updated.delete(key);
            else updated.set(key, next);

            return updated;
        }, { replace: true });
    }, [key, setParams]);

    return [params.get(key) ?? fallback, setValue];
}

/** A comma-joined list parameter, for multi-select controls. Values must not contain commas. */
export function useUrlParamList(key: string): [string[], (next: string[] | null | undefined) => void] {
    const [params, setParams] = useSearchParams();

    const raw = params.get(key);

    const value = useMemo(
        () => (raw ? raw.split(",").filter(Boolean) : EMPTY),
        [raw]
    );

    const setValue = useCallback((next: string[] | null | undefined) => {
        setParams(prev => {
            const updated = new URLSearchParams(prev);

            if (next?.length) updated.set(key, next.join(","));
            else updated.delete(key);

            return updated;
        }, { replace: true });
    }, [key, setParams]);

    return [value, setValue];
}

/** The `key:value,...` encoding `useUrlParamMap` uses. `null` means "remove the param". */
export function encodeParamMap(map: Record<string, string> | null | undefined): string | null {
    const entries = Object.entries(map ?? {}).filter(([, v]) => v != null && v !== "");
    return entries.length ? entries.map(([k, v]) => `${k}:${v}`).join(",") : null;
}

/**
 * A `key:value` comma-joined map parameter, for per-item selections keyed by
 * a dynamic set of ids. `setValue` takes the full next map, not an updater.
 */
export function useUrlParamMap(key: string): [Record<string, string>, (next: Record<string, string> | null | undefined) => void] {
    const [params, setParams] = useSearchParams();

    const raw = params.get(key);

    const value = useMemo((): Record<string, string> => {
        if (!raw) return EMPTY_MAP;

        return Object.fromEntries(
            raw.split(",").filter(Boolean).map(pair => pair.split(":"))
        );
    }, [raw]);

    const setValue = useCallback((next: Record<string, string> | null | undefined) => {
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
