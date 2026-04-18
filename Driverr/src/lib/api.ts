const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/marketplace/api/v1';

// During development, you can set VITE_DEV_TOKEN in .env to test without logging in
let authToken: string | null = import.meta.env.VITE_DEV_TOKEN || null;

export function setToken(token: string) {
  authToken = token;
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };

  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  const config: RequestInit = {
    ...options,
    headers: {
      ...headers,
      ...options.headers,
    },
  };

  const response = await fetch(`${BASE_URL}${endpoint}`, config);

  // Safe JSON parse — avoids crash when server returns HTML (e.g. 404 page)
  let data: any = null;
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    try {
      data = await response.json();
    } catch {
      data = null;
    }
  }

  if (!response.ok) {
    const msg = data?.message || data?.error || `خطأ ${response.status}: ${response.statusText}`;
    throw new Error(msg);
  }

  return data;
}

// 1. Authentication
export const authApi = {
  requestOtp: (phoneNumber: string) => 
    request<any>('/Auth/driver/request-otp', {
      method: 'POST',
      body: JSON.stringify({ phoneNumber }),
    }),
    
  verifyOtp: (phoneNumber: string, otp: string) => 
    request<any>('/Auth/driver/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ phoneNumber, otp }),
    }),

};

// 2. My Account & Driver creation
export const accountApi = {
  getMyAccount: () => 
    request<any>('/Driver/MyAccount', { method: 'GET' }),

  createDriver: (data: {
    name: string;
    phoneNumber: string;
    companyId: string;
    carModel: string;
    carBrand: string;
    carLicensePlate: string;
  }) =>
    request<any>('/Driver', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

// 3. Ride Offers
export const rideOffersApi = {
  createOffer: (offerData: any) => 
    request<any>('/RideOffer', {
      method: 'POST',
      body: JSON.stringify(offerData),
    }),
    
  // Backend expects PageNum and PageSize (Capitalized) per your Swagger JSON
  getMyOffers: (pageNum = 1, pageSize = 20) => 
    request<any>(`/RideOffer/MyOffers?PageNum=${pageNum}&PageSize=${pageSize}`, { method: 'GET' }),
    
  pollOfferStatus: (rideOfferId: string) => 
    request<any>(`/RideOffer/${rideOfferId}/Status`, { method: 'GET' }),
    
  searchAll: (params: string) => 
    request<any>(`/RideOffer/Search?${params}`, { method: 'GET' }),
    
  cancelOffer: (rideOfferId: string) => 
    request<any>(`/RideOffer/${rideOfferId}`, { method: 'DELETE' }),
};

// 4. Rides
export const ridesApi = {
  getPendingRequests: (rideOfferId: string) => 
    request<any>(`/Ride/offer/${rideOfferId}/pending`, { method: 'GET' }),
    
  acceptRequest: (rideId: string) => 
    request<any>(`/Ride/${rideId}/accept`, { method: 'POST' }),
    
  declineRequest: (rideId: string) => 
    request<any>(`/Ride/${rideId}/decline`, { method: 'POST' }),
    
  startPickup: (rideId: string) => 
    request<any>(`/Ride/${rideId}/pickup`, { method: 'POST' }),
    
  markArrived: (rideId: string) => 
    request<any>(`/Ride/${rideId}/arrived`, { method: 'POST' }),
    
  completeTrip: (rideId: string) => 
    request<any>(`/Ride/${rideId}/complete`, { method: 'POST' }),
};
