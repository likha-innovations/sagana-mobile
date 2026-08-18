import Constants from 'expo-constants';
import { ApiError, ApiResponse, ApiErrorResponse } from '@/types';
import { getAuthToken } from '@/lib/auth-token';
import { logger } from '@/lib/logger';

// Dynamically resolves backend API URL: Production URL -> Custom IP -> LAN IP (Metro) -> Localhost
function getApiBaseUrl(): string {
  // 1. Production / Remote URL from .env (if set with actual content)
  const prodUrl = process.env.EXPO_PUBLIC_API_BASE_URL?.trim();
  if (prodUrl) {
    return prodUrl.replace(/\/$/, '');
  }

  // 2. Explicit custom IP override from .env
  const customIp = process.env.EXPO_PUBLIC_IP_ADDRESS?.trim();
  if (customIp) {
    return `http://${customIp}:3000`;
  }

  // 3. Dynamic LAN IP auto-detected from Expo Metro hostUri
  const debuggerHost =
    Constants.expoConfig?.hostUri ||
    (Constants as any).manifest?.debuggerHost ||
    (Constants as any).manifest2?.extra?.expoGo?.debuggerHost;

  if (debuggerHost) {
    const ip = debuggerHost.split(':')[0];
    if (ip) {
      return `http://${ip}:3000`;
    }
  }

  // 4. Default Localhost Fallback (for Web / Simulators)
  return 'http://localhost:3000';
}

const API_BASE_URL = getApiBaseUrl();

export interface FetchOptions extends RequestInit {
  withAuth?: boolean;
}

// Typed Native Fetch Wrapper for Sagana Backend with auto JWT injection
export async function apiFetch<T>(
  endpoint: string,
  options: FetchOptions = {}
): Promise<T> {
  const { withAuth = true, headers, ...restOptions } = options;

  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${API_BASE_URL}${normalizedEndpoint}`;

  const requestHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...(headers as Record<string, string>),
  };

  if (withAuth) {
    const token = await getAuthToken();

    if (!token) {
      logger.warn(`[AUTH] Missing token for protected endpoint: ${normalizedEndpoint}`, 'APIClient');
      throw new ApiError(401, 'Authentication required. Please sign in.');
    }

    requestHeaders['Authorization'] = `Bearer ${token}`;
  }

  logger.debug(`[HTTP] ${options.method || 'GET'} -> ${url}`, 'APIClient');

  try {
    const response = await fetch(url, {
      ...restOptions,
      headers: requestHeaders,
    });

    const json = await response.json().catch(() => null);

    if (!response.ok) {
      const errorData = json as ApiErrorResponse | null;
      const message =
        errorData?.message ||
        `Request failed with status code ${response.status}`;

      logger.error(`[HTTP ERROR] ${response.status} -> ${url}`, json, 'APIClient');
      throw new ApiError(response.status, message);
    }

    if (json && typeof json === 'object' && 'data' in json) {
      return (json as ApiResponse<T>).data;
    }

    return json as T;
  } catch (error: any) {
    if (error instanceof ApiError) {
      throw error;
    }

    logger.error(`[NETWORK ERROR] -> ${url}`, error, 'APIClient');
    throw new ApiError(0, error?.message || 'Network connection failed.');
  }
}

// Dedicated HTTP Method Helpers for Clean Endpoint Definitions
export const api = {
  get: <T>(endpoint: string, options?: FetchOptions) =>
    apiFetch<T>(endpoint, { ...options, method: 'GET' }),

  post: <T>(endpoint: string, body?: unknown, options?: FetchOptions) =>
    apiFetch<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),

  patch: <T>(endpoint: string, body?: unknown, options?: FetchOptions) =>
    apiFetch<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),

  put: <T>(endpoint: string, body?: unknown, options?: FetchOptions) =>
    apiFetch<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),

  delete: <T>(endpoint: string, options?: FetchOptions) =>
    apiFetch<T>(endpoint, { ...options, method: 'DELETE' }),
};
