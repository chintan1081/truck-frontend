import axios, { AxiosError, AxiosInstance } from 'axios';
import { safeStorage } from '@/lib/storage';

const TOKEN_STORAGE_KEY = 'flyash_auth_token';
export const API_BASE = import.meta.env.VITE_BACKEND_URL;

export class ApiError extends Error {
  readonly status: number;
  readonly details?: unknown;

  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

let authToken: string | null = safeStorage.get(TOKEN_STORAGE_KEY);
let onUnauthorized: (() => void) | null = null;

export function setAuthToken(token: string | null): void {
  authToken = token;
  if (token) {
    safeStorage.set(TOKEN_STORAGE_KEY, token);
  } else {
    safeStorage.remove(TOKEN_STORAGE_KEY);
  }
}

export function getAuthToken(): string | null {
  return authToken;
}

export function setUnauthorizedHandler(handler: (() => void) | null): void {
  onUnauthorized = handler;
}

const axiosClient: AxiosInstance = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
    ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
  },
});

const STATUS_MESSAGES: Record<number, string> = {
  400: 'Some information is missing or invalid. Please review and try again.',
  403: 'You don\'t have permission to perform this action.',
  404: 'The requested record was not found.',
  409: 'This action conflicts with existing data. Please check for duplicates.',
  422: 'The information provided is invalid. Please review and try again.',
  429: 'Too many requests. Please wait a moment and try again.',
  500: 'Something went wrong on our end. Please try again shortly.',
  502: 'The server is temporarily unavailable. Please try again.',
  503: 'Service is currently unavailable. Please try again later.',
};

const TECHNICAL_PATTERNS = [
  /^Route not found:/i,
  /sqlite/i,
  /typeorm/i,
  /prisma/i,
  /cannot read prop/i,
  /undefined is not/i,
  /null is not/i,
  /ECONNREFUSED/i,
  /ENOTFOUND/i,
  /\bat\s+\w+.*\(/,
];

function isTechnical(msg: string): boolean {
  return TECHNICAL_PATTERNS.some((p) => p.test(msg));
}

function formatValidationDetails(details: unknown): string {
  if (!details || typeof details !== 'object' || Array.isArray(details)) {
    return STATUS_MESSAGES[400];
  }
  const entries = Object.entries(details as Record<string, string>);
  if (entries.length === 0) return STATUS_MESSAGES[400];
  const lines = entries.map(([field, msg]) => {
    const label = field.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase());
    return `${label} ${msg}`;
  });
  return lines.join('. ') + '.';
}

axiosClient.interceptors.request.use((config) => {
  if (authToken) {
    config.headers['Authorization'] = `Bearer ${authToken}`;
  }
  return config;
});

axiosClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ error?: string; details?: unknown }>) => {
    const status = error.response?.status ?? 0;
    const url = error.config?.url ?? '';

    if (status === 401 && !url.includes('/auth/login') && !url.includes('/auth/register')) {
      onUnauthorized?.();
      throw new ApiError(401, 'Your session has expired. Please sign in again.');
    }

    if (!error.response) {
      throw new ApiError(0, 'Unable to reach the server. Please check your connection and try again.');
    }

    const data = error.response.data;
    const backendMsg = data && typeof data.error === 'string' ? data.error : null;

    let message: string;

    if (status === 400 && backendMsg === 'Validation failed' && data?.details) {
      message = formatValidationDetails(data.details);
    } else if (backendMsg && !isTechnical(backendMsg)) {
      message = backendMsg;
    } else {
      message = STATUS_MESSAGES[status] ?? 'An unexpected error occurred. Please try again.';
    }

    throw new ApiError(status, message, data?.details);
  }
);

interface RequestOptions {
  method?: HttpMethod;
  body?: unknown;
  signal?: AbortSignal;
}

export async function apiRequest<T = any>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, signal } = options;
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

  const response = await axiosClient.request<T>({
    url: path,
    method,
    data: body,
    signal,
  });

  return response.data;
}

export const api = {
  get: <T = any>(endpoint: string, signal?: AbortSignal) => apiRequest<T>(endpoint, { method: 'GET', signal }),
  post: <T = any>(endpoint: string, body?: unknown) => apiRequest<T>(endpoint, { method: 'POST', body }),
  put: <T = any>(endpoint: string, body?: unknown) => apiRequest<T>(endpoint, { method: 'PUT', body }),
  delete: <T = any>(endpoint: string) => apiRequest<T>(endpoint, { method: 'DELETE' }),
};
