import axios, { AxiosError, AxiosInstance } from 'axios';
import { safeStorage } from '@/lib/storage';
import type { Order } from '@/types';

/**
 * Standalone API client for the truck-driver portal (/truck). Deliberately
 * separate from services/api/client.ts — drivers authenticate with their own
 * JWT (DriverEntity, not UserEntity), stored under its own key so an admin
 * session and a driver session never share or clobber each other's token.
 */

const TOKEN_STORAGE_KEY = 'flyash_driver_token';
const API_BASE = import.meta.env.VITE_BACKEND_URL;

export class DriverApiError extends Error {
  readonly status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = 'DriverApiError';
    this.status = status;
  }
}

let driverToken: string | null = safeStorage.get(TOKEN_STORAGE_KEY);

export function getDriverToken(): string | null {
  return driverToken;
}

export function setDriverToken(token: string | null): void {
  driverToken = token;
  if (token) safeStorage.set(TOKEN_STORAGE_KEY, token);
  else safeStorage.remove(TOKEN_STORAGE_KEY);
}

const client: AxiosInstance = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

client.interceptors.request.use((config) => {
  if (driverToken) config.headers['Authorization'] = `Bearer ${driverToken}`;
  return config;
});

client.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ error?: string }>) => {
    if (!error.response) {
      throw new DriverApiError(0, 'Unable to reach the server. Please check your connection and try again.');
    }
    const message = error.response.data?.error || 'Something went wrong. Please try again.';
    throw new DriverApiError(error.response.status, message);
  }
);

export interface DriverProfile {
  id: string;
  name: string;
  phoneNumber: string;
}

export interface DriverTruck {
  id: string;
  plateNumber: string;
  truckNumber: string;
  name: string;
  mileage: number;
  currentOdometer: number;
  status: string;
  insuranceExpiry: string;
  fitnessExpiry: string;
  permitExpiry: string;
  pollutionExpiry: string;
  rcExpiry: string;
  lastServiceDate: string;
  odometerAtLastService?: number;
  serviceIntervalKm?: number;
  driverScore: number;
}

export interface DriverSalary {
  id: string;
  month: string;
  salaryType: string;
  baseRate: number;
  presentDays: number;
  bonus: number;
  deductions: number;
  advanceAdjusted: number;
  netPayable?: number;
  createdAt: string;
}

export async function driverLogin(phoneNumber: string, password: string): Promise<DriverProfile> {
  const { data } = await client.post('/driver-auth/login', { phoneNumber, password });
  setDriverToken(data.token);
  return data.driver;
}

export async function fetchDriverMe(): Promise<DriverProfile | null> {
  try {
    const { data } = await client.get('/driver-auth/me');
    return data.driver;
  } catch (err) {
    if (err instanceof DriverApiError && (err.status === 401 || err.status === 403)) return null;
    throw err;
  }
}

export async function fetchMyOrders(): Promise<Order[]> {
  const { data } = await client.get('/driver-auth/orders');
  return data.data;
}

export async function acceptOrder(orderId: string): Promise<Order> {
  const { data } = await client.post(`/driver-auth/orders/${orderId}/accept`);
  return data;
}

export async function rejectOrder(orderId: string): Promise<void> {
  await client.post(`/driver-auth/orders/${orderId}/reject`);
}

export async function pickupOrder(orderId: string, challanNumber?: string): Promise<Order> {
  const { data } = await client.post(`/driver-auth/orders/${orderId}/pickup`, { challanNumber });
  return data;
}

export async function deliverOrder(orderId: string): Promise<Order> {
  const { data } = await client.post(`/driver-auth/orders/${orderId}/deliver`);
  return data;
}

export async function fetchMyTruck(): Promise<DriverTruck | null> {
  const { data } = await client.get('/driver-auth/truck');
  return data.truck;
}

export async function fetchMyEarnings(): Promise<{ salaries: DriverSalary[]; deliveredCount: number }> {
  const { data } = await client.get('/driver-auth/earnings');
  return data;
}

export function driverLogout(): void {
  setDriverToken(null);
}
