/**
 * Base URL of the backend.
 *
 * Set `VITE_API_URL` in `frontend/.env` to point at a deployed backend. Vite
 * inlines it at build time, so a change requires a restart, not just a reload.
 * The fallback matches the port `npm run dev` starts uvicorn on.
 */
export const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

/**
 * A request that did not produce a usable JSON body.
 *
 * `status` is 0 for a network-level failure — backend down, DNS, CORS — which
 * has no HTTP status but is the case a reader most needs told apart from a 404.
 */
export class ApiError extends Error {
    constructor(message, { status = 0, path, cause } = {}) {
        super(message, { cause });
        this.name = "ApiError";
        this.status = status;
        this.path = path;
    }
}

/**
 * GET `path` from the backend and parse the JSON body.
 *
 * @param {string} path Absolute path including the leading slash, e.g. `/runs/`.
 * @param {{signal?: AbortSignal}} [options]
 * @returns {Promise<any>}
 * @throws {ApiError} On a non-2xx response or a network failure. An abort
 *         propagates as the original `AbortError` instead, so callers can drop
 *         it without having to inspect an `ApiError` to tell the two apart.
 */
export async function apiGet(path, { signal } = {}) {
    let response;

    try {
        response = await fetch(`${BASE_URL}${path}`, { signal });
    } catch (cause) {
        if (cause.name === "AbortError") throw cause;

        throw new ApiError(
            `Could not reach the backend at ${BASE_URL}`,
            { path, cause }
        );
    }

    if (!response.ok) {
        throw new ApiError(
            `${response.status} ${response.statusText || "error"} from ${path}`,
            { status: response.status, path }
        );
    }

    return response.json();
}
