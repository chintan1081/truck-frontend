import axios from 'axios';
import { api, setAuthToken, getAuthToken, API_BASE } from './client';

/**
 * Auth API surface. Mirrors the backend /api/auth contract:
 *   POST /auth/register { email, password, name?, role? } -> { token, user }
 *   POST /auth/login    { email, password }               -> { token, user }
 *   GET  /auth/me                                          -> { user }
 *
 * Every successful login/register persists the returned token via the client so
 * subsequent requests are authenticated automatically.
 */

export type UserRoleName = 'ADMIN' | 'DRIVER' | 'ACCOUNTANT';

export interface AuthUser {
  id: string;
  email: string;
  role: UserRoleName;
  name: string | null;
  profilePhoto: string | null;
}

export interface AuthResult {
  token: string;
  user: AuthUser;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput extends LoginInput {
  name?: string;
  role?: UserRoleName;
}

export async function login(input: LoginInput): Promise<AuthResult> {
  const result = await api.post<AuthResult>('/auth/login', input);
  setAuthToken(result.token);
  return result;
}

export async function register(input: RegisterInput): Promise<AuthResult> {
  const result = await api.post<AuthResult>('/auth/register', input);
  setAuthToken(result.token);
  return result;
}

/** Validates the stored token and returns the current user, or null if invalid. */
export async function fetchCurrentUser(): Promise<AuthUser | null> {
  try {
    const { user } = await api.get<{ user: AuthUser }>('/auth/me');
    return user;
  } catch {
    return null;
  }
}

/** Clears the local session. There is no server-side token revocation. */
export function logout(): void {
  setAuthToken(null);
}

/** Uploads a profile photo via multipart/form-data and returns the base64 data URL. */
export async function uploadProfilePhoto(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('photo', file);

  const token = getAuthToken();
  const response = await axios.put<{ profilePhoto: string }>(
    `${API_BASE}/users/profile-photo`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    }
  );
  return response.data.profilePhoto;
}
