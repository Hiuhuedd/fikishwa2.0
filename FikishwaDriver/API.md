# Fikishwa Driver App - Backend API Documentation

**Base URL**: `http://localhost:3000` (Development)  
**Production URL**: TBD

---

## Authentication

All driver endpoints require JWT authentication via the `Authorization: Bearer <token>` header.

### Token Structure
```json
{
  "uid": "driver-unique-id",
  "phone": "254XXXXXXXXX",
  "role": "driver",
  "iat": 1234567890,
  "exp": 1234567890
}
```

---

## 1. Driver Authentication & Registration

### 1.1 Send OTP
**Endpoint**: `POST /api/driver/auth/send-otp`  
**Auth**: None  
**Description**: Initiates OTP verification for driver login/registration

**Request**:
```json
{
  "phone": "+254711223344"
}
```

**Response**:
```json
{
  "sessionId": "unique-session-id",
  "message": "OTP sent successfully"
}
```

**Error Codes**:
- `400`: Invalid phone number format
- `500`: SMS service error

---

### 1.2 Verify OTP
**Endpoint**: `POST /api/driver/auth/verify-otp`  
**Auth**: None  
**Description**: Verifies OTP and returns JWT token

**Request**:
```json
{
  "sessionId": "unique-session-id",
  "otp": "123456"
}
```

**Response**:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "driver": {
    "uid": "driver-id",
    "phone": "+254711223344",
    "name": "John Doe",
    "registrationStatus": "incomplete|pending|approved|rejected",
    "isEnabled": true,
    "profilePhotoUrl": "https://...",
    "rating": 4.8,
    "totalTrips": 150
  }
}
```

**Error Codes**:
- `400`: Invalid OTP
- `404`: Session not found
- `500`: Server error

---

### 1.3 Update Profile / Complete Registration
**Endpoint**: `POST /api/driver/auth/update-profile`  
**Auth**: Required (Driver JWT)  
**Description**: Updates driver profile or completes initial registration

**Request**:
```json
{
  "name": "Jane Driver",
  "email": "jane@example.com",
  "address": "123 Nairobi St",
  "idFrontUrl": "https://cloudinary.com/id_front.jpg",
  "idBackUrl": "https://cloudinary.com/id_back.jpg",
  "licenseUrl": "https://cloudinary.com/license.jpg",
  "taxCertUrl": "https://cloudinary.com/tax.jpg",
  "psvBadgeUrl": "https://cloudinary.com/psv.jpg",
  "goodConductUrl": "https://cloudinary.com/conduct.jpg",
  "carMake": "Toyota",
  "carModel": "Fielder",
  "carYear": "2018",
  "carImageUrl": "https://cloudinary.com/car.jpg",
  "carRegistrationUrl": "https://cloudinary.com/reg.jpg",
  "profilePhotoUrl": "https://cloudinary.com/profile.jpg",
  "bankName": "KCB",
  "accountNumber": "1234567890",
  "agreementsAccepted": true
}
```

**Response**:
```json
{
  "message": "Profile updated successfully",
  "driver": {
    "uid": "driver-id",
    "registrationStatus": "pending",
    ...
  }
}
```

**Validation Rules**:
- All document URLs must be valid HTTPS URLs
- `agreementsAccepted` must be `true` for registration completion
- Phone number cannot be changed
- `carYear` must be within reasonable range (1990-current year)

---

## 2. Driver Ride Operations

### 2.1 Go Online
**Endpoint**: `POST /api/driver/ride/status/online`  
**Auth**: Required (Driver JWT)  
**Description**: Sets driver status to online and available for ride requests

**Request**:
```json
{
  "location": {
    "lat": -1.2621,
    "lng": 36.8089
  },
  "categoryId": "standard" // optional: specific vehicle category
}
```

**Response**:
```json
{
  "message": "Driver is now online",
  "status": "online",
  "location": { "lat": -1.2621, "lng": 36.8089 }
}
```

**Requirements**:
- Driver must have `registrationStatus: "approved"`
- Driver must have `isEnabled: true`

---

### 2.2 Go Offline
**Endpoint**: `POST /api/driver/ride/status/offline`  
**Auth**: Required (Driver JWT)  
**Description**: Sets driver status to offline

**Request**: Empty body

**Response**:
```json
{
  "message": "Driver is now offline",
  "status": "offline"
}
```

---

### 2.3 Accept Ride
**Endpoint**: `POST /api/driver/ride/accept`  
**Auth**: Required (Driver JWT)  
**Description**: Accepts an incoming ride request

**Request**:
```json
{
  "rideId": "ride-unique-id"
}
```

**Response**:
```json
{
  "message": "Ride accepted",
  "ride": {
    "rideId": "ride-unique-id",
    "customerId": "customer-id",
    "customerName": "John Customer",
    "customerPhone": "+254700000000",
    "pickup": {
      "lat": -1.2621,
      "lng": 36.8089,
      "address": "Westlands, Nairobi"
    },
    "stops": [
      {
        "lat": -1.2833,
        "lng": 36.8167,
        "address": "Kenyatta Avenue"
      }
    ],
    "dropoff": {
      "lat": -1.3121,
      "lng": 36.8219,
      "address": "Upper Hill"
    },
    "rideType": "inperson|parcel",
    "fare": 500,
    "estimatedDistance": 8.5,
    "estimatedDuration": 25,
    "status": "accepted"
  }
}
```

**Error Codes**:
- `404`: Ride not found
- `409`: Ride already accepted by another driver
- `400`: Driver not online

---

### 2.4 Start Ride
**Endpoint**: `POST /api/driver/ride/start`  
**Auth**: Required (Driver JWT)  
**Description**: Marks ride as started (driver has picked up customer/parcel)

**Request**:
```json
{
  "rideId": "ride-unique-id"
}
```

**Response**:
```json
{
  "message": "Ride started",
  "ride": {
    "rideId": "ride-unique-id",
    "status": "in_progress",
    "startedAt": "2024-03-20T10:30:00Z"
  }
}
```

---

### 2.5 Complete Ride
**Endpoint**: `POST /api/driver/ride/complete`  
**Auth**: Required (Driver JWT)  
**Description**: Marks ride as completed

**Request**:
```json
{
  "rideId": "ride-unique-id",
  "actualDistanceKm": 9.8,
  "actualDurationMin": 28,
  "parcelPhotoUrl": "https://cloudinary.com/parcel.jpg", // if parcel ride
  "parcelOtp": "1234" // if parcel ride
}
```

**Response**:
```json
{
  "message": "Ride completed",
  "ride": {
    "rideId": "ride-unique-id",
    "status": "completed",
    "completedAt": "2024-03-20T11:00:00Z",
    "earnings": {
      "grossFare": 500,
      "commission": 15,
      "netEarnings": 485
    }
  }
}
```

---

### 2.6 Rate Customer
**Endpoint**: `POST /api/driver/ride/rate-customer`  
**Auth**: Required (Driver JWT)  
**Description**: Submits rating for customer after ride completion

**Request**:
```json
{
  "rideId": "ride-unique-id",
  "stars": 5,
  "comment": "Great passenger!"
}
```

**Response**:
```json
{
  "message": "Customer rated successfully"
}
```

**Validation**:
- `stars`: 1-5 (integer)
- `comment`: optional, max 500 characters

---

### 2.7 Get Recent Rides
**Endpoint**: `GET /api/driver/ride/recent?limit=10`  
**Auth**: Required (Driver JWT)  
**Description**: Retrieves driver's recent rides with earnings

**Query Parameters**:
- `limit`: Number of rides to return (default: 10, max: 50)

**Response**:
```json
{
  "rides": [
    {
      "rideId": "ride-id",
      "customerId": "customer-id",
      "customerName": "John Doe",
      "pickup": { "address": "Westlands" },
      "dropoff": { "address": "Upper Hill" },
      "status": "completed",
      "fare": 500,
      "commission": 15,
      "netEarnings": 485,
      "completedAt": "2024-03-20T11:00:00Z",
      "rating": 5
    }
  ],
  "total": 150
}
```

---

### 2.8 Get Available Categories
**Endpoint**: `GET /api/driver/ride/available-categories`  
**Auth**: Required (Driver JWT)  
**Description**: Gets vehicle categories available to this driver

**Response**:
```json
{
  "categories": [
    {
      "categoryId": "standard",
      "name": "Standard",
      "baseFare": 150,
      "perKmRate": 50,
      "perMinRate": 10,
      "maxPassengers": 4,
      "luggageCapacity": "2 large bags"
    }
  ]
}
```

---

## 3. Driver Earnings & Payouts

### 3.1 Get Daily Payout History
**Endpoint**: `GET /api/driver/payout/daily-history?date=2024-03-20`  
**Auth**: Required (Driver JWT)  
**Description**: Retrieves earnings breakdown for a specific date

**Query Parameters**:
- `date`: YYYY-MM-DD format (optional, defaults to today)

**Response**:
```json
{
  "date": "2024-03-20",
  "summary": {
    "totalRides": 12,
    "grossEarnings": 6000,
    "commission": 180,
    "netEarnings": 5820,
    "payoutPreference": "direct|app_managed"
  },
  "rides": [
    {
      "rideId": "ride-id",
      "fare": 500,
      "commission": 15,
      "netEarnings": 485,
      "completedAt": "2024-03-20T11:00:00Z"
    }
  ]
}
```

---

## 4. Socket.io Real-Time Events

### Connection
```javascript
import io from 'socket.io-client';

const socket = io('http://localhost:3000', {
  auth: {
    token: 'driver-jwt-token'
  }
});
```

### Events to Listen

#### 4.1 `ride:request`
**Description**: New ride request for this driver

**Payload**:
```json
{
  "rideId": "ride-id",
  "customerId": "customer-id",
  "customerName": "John Doe",
  "pickup": { "lat": -1.2621, "lng": 36.8089, "address": "Westlands" },
  "dropoff": { "lat": -1.3121, "lng": 36.8219, "address": "Upper Hill" },
  "stops": [],
  "rideType": "inperson",
  "fare": 500,
  "estimatedDistance": 8.5,
  "estimatedDuration": 25,
  "expiresAt": "2024-03-20T10:05:00Z" // 30 seconds from now
}
```

#### 4.2 `ride:cancelled`
**Description**: Customer cancelled the ride

**Payload**:
```json
{
  "rideId": "ride-id",
  "reason": "Customer cancelled"
}
```

#### 4.3 `registration:status_updated`
**Description**: Admin approved/rejected driver registration

**Payload**:
```json
{
  "status": "approved|rejected",
  "reason": "Blurry ID photo" // if rejected
}
```

#### 4.4 `earnings:updated`
**Description**: New earnings posted

**Payload**:
```json
{
  "rideId": "ride-id",
  "netEarnings": 485,
  "totalEarningsToday": 5820
}
```

### Events to Emit

#### 4.5 `driver:location_update`
**Description**: Send location updates while online

**Payload**:
```json
{
  "lat": -1.2621,
  "lng": 36.8089
}
```

**Frequency**: Every 10-15 seconds while online

---

## 5. Error Response Format

All errors follow this structure:

```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {} // optional additional info
}
```

**Common Error Codes**:
- `UNAUTHORIZED`: Missing or invalid JWT token
- `FORBIDDEN`: Driver not approved or disabled
- `NOT_FOUND`: Resource not found
- `VALIDATION_ERROR`: Invalid request data
- `CONFLICT`: Resource state conflict (e.g., ride already accepted)
- `SERVER_ERROR`: Internal server error

---

## 6. Cloudinary Upload Integration

**Upload Endpoint**: `https://api.cloudinary.com/v1_1/{cloud_name}/image/upload`

**Required Fields**:
- `file`: Base64 image or file
- `upload_preset`: Your unsigned upload preset
- `folder`: "fikishwa/drivers"

**Example Response**:
```json
{
  "secure_url": "https://res.cloudinary.com/...",
  "public_id": "fikishwa/drivers/abc123"
}
```

Use `secure_url` for all document/photo URLs in API requests.

---

## 7. Rate Limiting

- **Authentication endpoints**: 5 requests per minute per phone number
- **Ride operations**: 60 requests per minute per driver
- **Location updates**: 10 requests per minute per driver

---

## 8. Testing Credentials

**Test Driver Phone**: `+254711223344`  
**Test OTP**: `123456` (development only)

---

## Notes

1. All timestamps are in ISO 8601 format (UTC)
2. All monetary values are in KES (Kenyan Shillings)
3. All distances are in kilometers
4. All durations are in minutes
5. Phone numbers must include country code (+254 for Kenya)
