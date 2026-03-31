# 5-Phase Ride Flow Implementation

## Overview
This document outlines the implementation of the 5-phase ride journey flow for the Fikishwa Driver and Customer mobile apps.

---

## Phase 1: Post-Acceptance (Navigating to Pickup)
**Trigger:** Customer requests a ride and Driver accepts

### Driver UI
- **Primary Button:** "Confirm Arrival at Pickup" (Blue, #007AFF)
- **Map Display:** Shows route from current location to pickup point only
- **Status:** "Accepting ride..."
- **Destination Details:** Hidden - not displayed to driver yet

### Customer UI
- **Status Message:** "Driver is on the way"
- **Map Display:** Shows only pickup point, live car marker moving toward pickup
- **Destination:** Completely hidden from view
- **UI State:** `rideStatus = 'arriving'`

### Implementation Details
**Driver HomeScreen:**
- Button condition: `activeRide.status === 'accepted' || activeRide.status === 'picking_up'`
- MapViewDirections destination: Pickup point

**Customer ActiveRideScreen:**
- Socket listener: `ride-matched`, `ride-accepted`, `driver:location_update`
- MapViewDirections destination: Pickup point
- Status label: "Driver is on the way"

---

## Phase 2: Arrival (Ready for Pickup)
**Trigger:** Driver reaches pickup location and clicks "Confirm Arrival at Pickup"

### Driver UI
- **Status Update:** Button transforms to green "Start Trip (Customer in Car)"
- **Status Message:** "Waiting for customer to board"
- **Map Display:** Still shows pickup location
- **Action:** Driver waits for customer to enter vehicle

### Customer UI
- **Notification:** "Driver has arrived!"
- **Status Pill:** Shows arrival confirmation
- **Map Display:** Still shows pickup point with driver marker at location
- **Destination:** Still hidden
- **UI State:** `rideStatus = 'arrived'`

### Implementation Details
`handleArrived()` function:
```javascript
// Updates ride status to 'arrived'
// Emits socket event 'driver-arrived' to notify customer
socketService.emit('driver-arrived', { rideId: activeRide.rideId });
```

**Socket Events:**
- Driver emits: `driver-arrived`
- Customer listens: `ride:arrived`, `ride-arrived`, `driver-arrived`

---

## Phase 3: The Ride Session (Navigating to Destination)
**Trigger:** Driver clicks "Start Trip (Customer in Car)" button

### Synchronization Point
At this moment, **BOTH apps must synchronize** their MapViewDirections:
- Driver receives: Status update to `in_progress`
- Customer receives: Status update to `in_progress`
- Both switch destination to final dropoff location

### Driver UI
- **Primary Button:** "End Trip & Complete" (Red, #FF3B30)
- **Status Message:** "Heading to Destination"
- **Map Display:** Shows route from current location to dropoff point
- **Customer Info:** Still visible below
- **Cancel Option:** Can still cancel via X button (shows cancellation modal)

### Customer UI
- **Status Message:** "Heading to [Destination]"
- **Map Display:** Shows driver moving toward dropoff location
- **Destination Marker:** Now visible
- **Trip Details:** Fare breakdown visible
- **UI State:** `rideStatus = 'in_progress'`

### Implementation Details
`handleStartRide()` function:
```javascript
// Updates ride status to 'in_progress'
// Emits socket event with destination info
socketService.emit('ride-started-heading-to-destination', { 
    rideId: activeRide.rideId,
    destination: activeRide.dropoff 
});
```

**MapViewDirections Switch:**
```javascript
// Driver HomeScreen
destination={(activeRide.status === 'in_progress') ? 
    dropoff : pickup}

// Customer ActiveRideScreen
destination={(rideStatus === 'in_progress') ? 
    dropoff : pickup}
```

**Socket Events:**
- Driver emits: `ride-started-heading-to-destination`
- Customer listens: `ride:started`, `ride-started`, `ride-started-heading-to-destination`
- Status label changes to: "Heading to Destination"

---

## Phase 4: Completion & Summary
**Trigger:** Driver reaches destination and clicks "End Trip & Complete"

### Driver UI
- **Button Update:** Changes to green "Confirm Payment Received"
- **Status Message:** "Trip Completed"
- **Sub-message:** "Waiting for payment confirmation"
- **Map Display:** Shows final destination
- **Next Action:** Wait for customer to see and confirm payment

### Customer UI
- **Summary Modal Appears** with:
  - "Trip Summary" header
  - Breakdown of trip (Distance, Duration)
  - Fare breakdown
  - "Waiting for driver to confirm payment..." message
  - Total fare amount prominently displayed
- **Modal State:** `showSummary = true`
- **UI State:** `rideStatus = 'completed'`

### Implementation Details
`handleCompleteRide()` function:
```javascript
// Updates ride status to 'completed'
// Emits socket event to show customer summary
socketService.emit('ride-completed-show-summary', { 
    rideId: activeRide.rideId,
    summary: response.data.summary
});
```

**Customer Socket Listeners:**
- `ride:completed`
- `ride-completed`
- `ride-completed-show-summary`
- All trigger: `setShowSummary(true)`

**Summary Modal Displays:**
- Distance traveled
- Duration of ride
- Trip fare
- Total paid
- Waiting indicator (spinner + text)

---

## Phase 5: Feedback Loop
**Trigger:** Driver clicks "Confirm Payment Received"

### Driver UI
- **Action:** Sends confirmation that payment is received
- **State:** Clears active ride, returns to online mode
- **Next Step:** Ready to accept new ride requests

### Customer UI
- **Summary Modal Closes**
- **Navigation:** Automatically navigates to Rating Screen
- **Route:** `navigation.replace('RateDriver', { ... })`
- **Next Step:** Customer rates driver and provides feedback

### Implementation Details
`handleConfirmPayment()` function:
```javascript
// Calls API to confirm payment
// Emits socket event 'payment-confirmed'
socketService.emit('payment-confirmed', { rideId: activeRide.rideId });
// Clears active ride
setActiveRide(null);
```

**Socket Events:**
- Driver emits: `payment-confirmed`
- Customer listens: `payment-confirmed`
- Triggers navigation: `navigation.replace('RateDriver', ...)`

---

## Socket Events Summary

### Driver → Customer
| Event | Phase | Payload |
|-------|-------|---------|
| `driver-arrived` | 2 | `{ rideId }` |
| `ride-started-heading-to-destination` | 3 | `{ rideId, destination }` |
| `ride-completed-show-summary` | 4 | `{ rideId, summary }` |
| `payment-confirmed` | 5 | `{ rideId }` |
| `update-location` | 1-3 | `{ lat, lng, heading, speed }` |

### Customer → Driver
| Event | Context |
|-------|---------|
| `ride:accepted` | Ride accepted event from backend |

---

## File Changes

### Driver App
**File:** `FikishwaDriver/src/screens/Main/HomeScreen.tsx`

**Changes:**
1. Updated `handleArrived()` - Added socket event emission
2. Updated `handleStartRide()` - Changed status to `in_progress`, added socket event
3. Updated `handleCompleteRide()` - Added socket event emission
4. Updated `handleConfirmPayment()` - Added socket event emission
5. Refactored button rendering logic - Separated each phase into distinct conditions
6. Updated MapViewDirections - Uses `in_progress` status for route switching

### Customer App
**File:** `FikishwaCustomer/src/screens/main/ActiveRideScreen.tsx`

**Changes:**
1. Enhanced socket event listeners - Added new event handlers for driver events
2. Updated status labels - Phase 3 now shows "Heading to Destination"
3. Refined root state management - Separated `arriving`, `arrived`, `in_progress`, `completed` states
4. Updated MapViewDirections - Uses `in_progress` status for destination route
5. Summary modal logic - Already implemented, now properly triggered by socket events

---

## Key Features

### ✅ Destination Route Hidden During Phases 1-2
- Pickup route shown only
- Dropoff location hidden from rider
- Ensures minimal confusion and better UX

### ✅ Seamless Route Switching in Phase 3
- Automatic transition when ride starts
- Both apps show destination route
- Smooth animation and viewport adjustment

### ✅ Payment Confirmation Flow
- Driver confirms payment reception
- Customer sees summary before rating
- Clear handoff between phases

### ✅ Real-time Location Updates
- Driver location updates every 10 seconds
- Smooth animated marker movement
- Camera follows driver movement

### ✅ Proper Status States
- Clear distinction between phases
- Consistent status values across both apps
- No ambiguous state transitions

---

## Testing Checklist

- [ ] Driver accepts ride → Shows "Confirm Arrival at Pickup" (Phase 1)
- [ ] Customer sees "Driver is on the way" with pickup route only
- [ ] Driver clicks arrival → Button changes to "Start Trip" (Phase 2)
- [ ] Customer receives "Driver has arrived!" notification
- [ ] Driver clicks "Start Trip" → Map switches to destination route (Phase 3)
- [ ] Customer sees "Heading to Destination" and destination route
- [ ] Driver clicks "End Trip" → Button changes to "Confirm Payment" (Phase 4)
- [ ] Customer sees Trip Summary Modal with fare breakdown
- [ ] Driver clicks "Confirm Payment" → Emits payment-confirmed (Phase 5)
- [ ] Customer summary closes and navigates to Rating Screen
- [ ] All socket events fire correctly
- [ ] No console errors during transitions

---

## Future Enhancements

1. Add real-time ETA calculation
2. Implement dynamic pricing adjustments
3. Add support for multiple passengers
4. Implement ride-sharing features
5. Add in-app messaging between driver and customer
6. Implement safety features (share ride details, emergency button)
7. Add detailed trip analytics and receipts

---

## Notes

- Status values now standardized as: `accepted`, `arriving`, `arrived`, `in_progress`, `completed`
- All socket events follow consistent naming: `ride-*` or `driver-*` patterns
- Socket events are backward compatible with existing listeners
- Map updates happen automatically on status changes
- No manual route re-fetching needed - MapViewDirections handles it

