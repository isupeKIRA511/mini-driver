# Teleport.iq — Driver App API Reference

**Base URL:** `marketplace/api/v1`

Protected endpoints require:

```
Authorization: Bearer <token>
```

The token is returned by the [Verify OTP](#verify-otp--login) endpoint.

---

## Table of Contents

1. [Authentication](#1-authentication)
2. [My Account](#2-my-account)
3. [Ride Offers](#3-ride-offers)
4. [Rides — Managing Passenger Requests](#4-rides--managing-passenger-requests)
5. [Common Types](#5-common-types)
6. [Typical Flow](#6-typical-flow)

---

## 1. Authentication

No token required for these endpoints.

### Request OTP

```
POST /auth/driver/request-otp
```

**Body**

```json
{ "phoneNumber": "+9647801234567" }
```

**Response `200`**

```json
{ "success": true, "message": "OTP sent" }
```

---

### Verify OTP & Login

```
POST /auth/driver/verify-otp
```

**Body**

```json
{
  "phoneNumber": "+9647801234567",
  "otp": "482931"
}
```

**Response `200`** → [`AuthResponse`](#authresponse)

> Store the returned `token` and attach it to every subsequent request as `Authorization: Bearer <token>`.
>
> **This is the only way to obtain a token.** A phone-only login endpoint previously existed but was removed because it allowed anyone to authenticate as any registered phone number without any verification.

---

## 2. My Account

### Get My Account

```
GET /drivers/MyAccount
```

**Response `200`** → [`ApiGetOneResponse<DriverModel>`](#apigetoneresponse)

**Example response**

```json
{
  "success": true,
  "data": {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "name": "Mohammed Ali",
    "phoneNumber": "+9647801234567",
    "companyId": "a1b2c3d4-...",
    "carModel": "Camry",
    "carBrand": "Toyota",
    "carLicensePlate": "12 A 34567",
    "comfortScore": 4,
    "createdAt": "2026-01-10T08:00:00Z",
    "updatedAt": null,
    "deletedAt": null,
    "company": {
      "id": "a1b2c3d4-...",
      "name": "Baghdad Express",
      "status": true,
      "reputationScore": 85,
      "createdAt": "2025-12-01T00:00:00Z",
      "deletedAt": "0001-01-01T00:00:00Z"
    }
  },
  "message": "Driver retrieved successfully"
}
```

---

## 3. Ride Offers

### Create a Ride Offer

Your driver ID is read from the JWT automatically — do not send it in the body.

```
POST /rideoffers
```

**Body**

```json
{
  "price": 15000,
  "pickupProvince": "Baghdad",
  "dropoffProvince": "Basra",
  "destinationLatitude": 30.508,
  "destinationLongitude": 47.783,
  "maxPassengers": 4
}
```

| Field | Type | Description |
|-------|------|-------------|
| `price` | int | Fare in local currency (IQD) |
| `pickupProvince` | string | Departure province name |
| `dropoffProvince` | string | Destination province name |
| `destinationLatitude` | double | Drop-off GPS latitude |
| `destinationLongitude` | double | Drop-off GPS longitude |
| `maxPassengers` | int | Max number of passengers (0 = unlimited) |

**Response `200`** → [`ApiGetOneResponse<RideOfferModel>`](#apigetoneresponse)

> Save the returned `data.id` — all ride offer management endpoints use this `rideOfferId`.

---

### Get My Offers

Returns all offers created by you (the authenticated driver), paginated.

```
GET /rideoffers/MyOffers?pageNum=1&pageSize=20
```

**Query params** → [`PaginationQuery`](#paginationquery)

**Response `200`** → [`ApiGetManyResponse<RideOfferModel>`](#apigetmanyresponse)

---

### Poll Offer Status

Track the overall status of a specific offer (e.g. whether it has passengers, is in progress, completed, etc.).

```
GET /rideoffers/{rideOfferId}/Status
```

**Response `200`** → [`ApiGetOneResponse<RideOfferStatusResponse>`](#apigetoneresponse)

```json
{
  "success": true,
  "data": {
    "status": "AwaitingPassengers",
    "message": "بانتظار الركاب"
  },
  "message": "Status retrieved successfully"
}
```

**Offer status values**

| `status` | Meaning |
|----------|---------|
| `AwaitingPassengers` | Published, waiting for passengers to request |
| `PickingUpPassengers` | You are picking up passengers |
| `Transporting` | Trip in progress, heading to destination |
| `Completed` | Trip finished |
| `DriverCancelled` | You cancelled this offer |

---

### Search All Offers

Browse the full offer board (same endpoint customers use). Useful to see competition.

```
GET /rideoffers/Search?pickupProvince=Baghdad&dropoffProvince=Basra&seatCount=1&pageNum=1&pageSize=20
```

**Query params**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `pickupProvince` | string | ✓ | Departure province |
| `dropoffProvince` | string | ✓ | Destination province |
| `seatCount` | int | ✓ | Minimum available seats to match |
| `pageNum` | int | ✓ | Page number |
| `pageSize` | int | ✓ | Results per page (max 100) |

**Response `200`** → [`ApiGetManyResponse<RideOffersSearchFields>`](#apigetmanyresponse)

---

### Cancel Offer

```
DELETE /rideoffers/{rideOfferId}
```

**Response `200`** → [`ApiStatusResponse`](#apistatusresponse)

---

## 4. Rides — Managing Passenger Requests

### List Pending Requests for an Offer

Returns all ride bookings in `RequestingRide` state for one of your offers.

```
GET /rides/offer/{rideOfferId}/pending
```

**Response `200`**

```json
{
  "success": true,
  "data": [
    {
      "id": "ride-uuid-here",
      "status": "RequestingRide",
      "passengerName": "Sara Ahmed",
      "passengerId": "...",
      ...
    }
  ],
  "message": "Pending requests retrieved"
}
```

→ Full shape: array of [`RideModel`](#ridemodel) wrapped in [`ApiGetOneResponse`](#apigetoneresponse)

---

### Accept a Passenger Request

```
POST /rides/{rideId}/accept
```

**Response `200`** → [`ApiStatusResponse`](#apistatusresponse)

---

### Decline a Passenger Request

```
POST /rides/{rideId}/decline
```

**Response `200`** → [`ApiStatusResponse`](#apistatusresponse)

---

### Start Pickup

Signal that you have left to pick up the passenger. Transitions the ride to `PickingYouUp` on the passenger side.

```
POST /rides/{rideId}/pickup
```

**Response `200`** → [`ApiStatusResponse`](#apistatusresponse)

---

### Mark Arrived

Signal that you have reached the passenger's location. Transitions the ride to `TaxiAwaitingYou`.

```
POST /rides/{rideId}/arrived
```

**Response `200`** → [`ApiStatusResponse`](#apistatusresponse)

---

### Complete Trip

Signal that the trip is finished. Transitions both the ride and the offer to `Completed`.

```
POST /rides/{rideId}/complete
```

**Response `200`** → [`ApiStatusResponse`](#apistatusresponse)

---

## 5. Common Types

### AuthResponse

```ts
{
  id: string;           // Your driver UUID
  phoneNumber: string;
  token: string;        // JWT bearer token
}
```

---

### PaginationQuery

| Param | Type | Constraints |
|-------|------|-------------|
| `pageNum` | int | ≥ 1 |
| `pageSize` | int | 1 – 100 |
| `term` | string? | Optional text search |
| `startDate` | ISO 8601? | Optional date filter |
| `endDate` | ISO 8601? | Optional date filter |

---

### ApiGetOneResponse

```ts
{
  success: boolean;
  data: T;
  message: string;
}
```

---

### ApiGetManyResponse

```ts
{
  success: boolean;
  pageNum: number;
  pageSize: number;
  totalCount: number;
  data: T[];
  message: string;
}
```

---

### ApiStatusResponse

```ts
{
  success: boolean;
  code: number;
  message: string;
}
```

---

### DriverModel

```ts
{
  id: string;
  name: string;
  phoneNumber: string;
  companyId: string;
  carModel: string;
  carBrand: string;
  carLicensePlate: string;
  comfortScore: number;
  createdAt: string;        // ISO 8601
  updatedAt: string | null;
  deletedAt: string | null;
  company: CompanyModel | null;
}
```

---

### CompanyModel

```ts
{
  id: string;
  name: string;
  status: boolean;
  reputationScore: number;
  createdAt: string;
  deletedAt: string;
}
```

---

### RideOfferModel

```ts
{
  id: string;
  price: number;
  pickupProvince: string;
  dropoffProvince: string;
  destinationLatitude: number;
  destinationLongitude: number;
  maxPassengers: number;
  passengersCount: number;      // current confirmed passengers
  driverName: string;
  driverPhoneNumber: string;
  carBrand: string;
  carModel: string;
  carLicensePlate: string;
  companyName: string;
  companyReputation: number;
  carComfortScore: number;
  status: string;               // see offer status values above
  driverId: string;
  companyId: string;
}
```

---

### RideOfferStatusResponse

```ts
{
  status: string;    // e.g. "AwaitingPassengers"
  message: string;   // Arabic description
}
```

---

### RideOffersSearchFields

```ts
{
  price: number;
  pickupProvince: string;
  dropoffProvince: string;
  destinationLatitude: number;
  destinationLongitude: number;
  maxPassengers: number;
  companyName: string;
  driverName: string;
  carBrand: string;
  carModel: string;
}
```

---

### RideModel

```ts
{
  id: string;
  status: string;
  price: number;
  passengerName: string;
  driverName: string;
  driverPhoneNumber: string;
  rideOfferId: string;
  companyId: string;
  passengerId: string;
  driverId: string;
  pickupProvince: string;
  dropoffProvince: string;
  destinationLatitude: number;
  destinationLongitude: number;
}
```

---

## 6. Typical Flow

```
1.  POST /auth/driver/request-otp              → OTP sent to phone
2.  POST /auth/driver/verify-otp               → receive token
3.  POST /rideoffers { ... }                   → publish a ride offer → save rideOfferId
4.  GET  /rideoffers/{rideOfferId}/Status      → poll — wait for incoming requests
5.  GET  /rides/offer/{rideOfferId}/pending    → list passengers who requested
6.  POST /rides/{rideId}/accept                → accept a passenger
    POST /rides/{rideId}/decline               → or decline
7.  POST /rides/{rideId}/pickup                → you're on the way to pick up
8.  POST /rides/{rideId}/arrived               → you've arrived at the passenger
9.  POST /rides/{rideId}/complete              → trip done (repeat 5-9 per passenger if multiple)
```
