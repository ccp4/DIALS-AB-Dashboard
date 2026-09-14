/** Base URL of the backend, from `VITE_API_URL` (`frontend/.env`), inlined at build time. */
export const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

interface ApiErrorOptions {
    status?: number;
    path?: string;
    cause?: unknown;
}

/**
 * A request that did not produce a usable JSON body.
 * `status` is 0 for a network-level failure — backend down, DNS, CORS
 */
export class ApiError extends Error {
    status: number;
    path?: string;

    constructor(message: string, { status = 0, path, cause }: ApiErrorOptions = {}) {
        super(message, { cause });
        this.name = "ApiError";
        this.status = status;
        this.path = path;
    }
}

/**
 * GET `path` from the backend and parse the JSON body.
 * @throws {ApiError} On a non-2xx response or a network failure. Aborts throw the original `AbortError` instead.
 */
export async function apiGet<T = unknown>(path: string, { signal }: { signal?: AbortSignal } = {}): Promise<T> {
    let response: Response;

    try {
        response = await fetch(`${BASE_URL}${path}`, { signal });
    } catch (cause) {
        if (cause instanceof Error && cause.name === "AbortError") throw cause;

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
