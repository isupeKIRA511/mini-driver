import { writable, get } from 'svelte/store';
import { accountApi } from '../lib/api';

export type AppView = 'auth' | 'otp' | 'register' | 'offers' | 'create_offer' | 'requests' | 'active_trip' | 'profile';

// Navigation history stack for back button
export const navHistory = writable<AppView[]>(['auth']);

export const currentView = writable<AppView>('auth');
export const phoneNumber = writable<string>('');

// Navigate with history tracking
export function navigate(view: AppView) {
  navHistory.update(h => [...h, view]);
  currentView.set(view);
}

// Go back to previous view
export function goBack() {
  navHistory.update(h => {
    if (h.length <= 1) return h;
    const next = h.slice(0, -1);
    currentView.set(next[next.length - 1]);
    return next;
  });
}

// Whether user has a valid token
export const isAuthenticated = writable<boolean>(false);

export const driverProfile = writable<any>(null);

export async function fetchProfile() {
  try {
    const res = await accountApi.getMyAccount();
    if (res && res.data) {
      driverProfile.set(res.data);
      isAuthenticated.set(true);
      return res.data;
    }
    return null;
  } catch (error) {
    console.error('Failed to load profile', error);
    return null;
  }
}

// Stores for offers and active state
export const rideOffers = writable<any[]>([]);
export const pendingRequests = writable<any[]>([]);

export type TripStatus = 'Not Started' | 'Heading to Pickup' | 'Arrived at Pickup' | 'In Progress' | 'Completed';
export const activeTripStatus = writable<TripStatus>('Not Started');
export const currentActiveRide = writable<any>(null);
