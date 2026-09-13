/**
 * Centralized CPA Safe API Client
 * - Supports VITE_API_URL for production cross-domain deployments (e.g. Vercel frontend -> custom backend)
 * - Safe JSON parsing with Content-Type and HTTP status verification
 * - Graceful fallback to user-friendly messages on non-JSON (HTML 404/500) responses
 */

export interface ApiResponse<T = any> {
  ok: boolean;
  status: number;
  data: T;
  error?: string;
}

/**
 * Resolves the full URL for any CPA API endpoint.
 * - If VITE_API_URL is configured (e.g., frontend deployed on Vercel and backend hosted separately),
 *   it prepends VITE_API_URL (trimmed of any trailing slashes).
 * - If VITE_API_URL is empty, it uses relative same-origin path (e.g., /api/...).
 */
export function getApiUrl(endpoint: string): string {
  const metaEnv = (import.meta as any).env;
  const envUrl = ((metaEnv && metaEnv.VITE_API_URL) || '').trim().replace(/\/+$/, '');
  const cleanPath = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  if (!envUrl) {
    return cleanPath;
  }
  return `${envUrl}${cleanPath}`;
}

/**
 * Performs a network request with strict JSON verification and error isolation.
 * Guarantees that HTML error pages (such as Vercel 404 "The page could not be found")
 * never cause JSON syntax parse errors in the application.
 */
export async function safeApiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const url = getApiUrl(endpoint);
  const headers = new Headers(options.headers || {});

  if (!headers.has('Accept')) {
    headers.set('Accept', 'application/json');
  }

  try {
    const res = await fetch(url, {
      ...options,
      headers,
    });

    const contentType = res.headers.get('content-type') || '';
    const isJson = contentType.toLowerCase().includes('application/json');

    if (!isJson) {
      // Non-JSON response (e.g. Vercel 404 "The page could not be found", reverse proxy HTML, etc.)
      const textSample = await res.text().catch(() => '');
      console.warn(
        `[CPA API] Non-JSON response (${res.status}) from ${url}. Sample:`,
        textSample.slice(0, 100)
      );

      return {
        ok: false,
        status: res.status,
        data: {
          success: false,
          error: 'CPA authentication service is temporarily unavailable. Please try again.',
        } as unknown as T,
        error: 'CPA authentication service is temporarily unavailable. Please try again.',
      };
    }

    const data = await res.json();
    const isSuccess = res.ok && (data?.success !== false);

    return {
      ok: res.ok,
      status: res.status,
      data,
      error: data?.error || (!res.ok ? `Request failed with status ${res.status}` : undefined),
    };
  } catch (err: any) {
    console.error(`[CPA API] Network error calling ${url}:`, err);
    return {
      ok: false,
      status: 0,
      data: {
        success: false,
        error: 'Unable to contact CPA server. Please check your internet connection.',
      } as unknown as T,
      error: 'Unable to contact CPA server. Please check your internet connection.',
    };
  }
}

export async function apiGet<T = any>(endpoint: string, token?: string | null): Promise<ApiResponse<T>> {
  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return safeApiRequest<T>(endpoint, { method: 'GET', headers });
}

export async function apiPost<T = any>(
  endpoint: string,
  body?: any,
  token?: string | null
): Promise<ApiResponse<T>> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return safeApiRequest<T>(endpoint, {
    method: 'POST',
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}
