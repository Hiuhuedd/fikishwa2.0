# Fikishwa API Reference (JWT Mode)

## CUSTOMER AUTHENTICATION

1. Send OTP (Customer)
curl -X POST http://localhost:3000/api/customer/auth/send-otp -H "Content-Type: application/json" -d "{\"phone\": \"+254743466032\"}"

2. Verify OTP (Customer)
curl -X POST http://localhost:3000/api/customer/auth/verify-otp -H "Content-Type: application/json" -d "{\"sessionId\": \"YOUR_SESSION_ID\", \"otp\": \"123456\"}"

3. Update Profile (Customer)
curl -X POST http://localhost:3000/api/customer/auth/update-profile -H "Content-Type: application/json" -H "Authorization: Bearer YOUR_CUSTOMER_JWT_TOKEN" -d "{\"name\": \"John Doe\", \"profilePhotoUrl\": \"https://example.com/photo.jpg\", \"emergencyContact\": \"+254700000000\"}"

---

eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1aWQiOiJkMTk2NmI4Yy04MzRhLTQ5YWMtOWU1Ny1mZmU4YTEyOTRiZWUiLCJwaG9uZSI6IjI1NDc0MzQ2NjAzMiIsInJvbGUiOiJjdXN0b21lciIsImlhdCI6MTc2NzM3Nzk0MywiZXhwIjoxNzY5OTY5OTQzfQ.juN29184rodWfiLOlvXv6_xMFzy4b-VAs9wHH8AcQbA

## DRIVER AUTHENTICATION & REGISTRATION

4. Send OTP (Driver)
curl -X POST http://localhost:3000/api/driver/auth/send-otp -H "Content-Type: application/json" -d "{\"phone\": \"+254711223344\"}"

5. Verify OTP (Driver)
curl -X POST http://localhost:3000/api/driver/auth/verify-otp -H "Content-Type: application/json" -d "{\"sessionId\": \"YOUR_SESSION_ID\", \"otp\": \"123456\"}"

6. Complete Registration / Update Profile (Driver)
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1aWQiOiJiYzBhMzM2Ni1lYzUyLTQ4Y2UtOTU4Mi1iNDcxNzFhZTNiOTUiLCJwaG9uZSI6IjI1NDc0MzQ2NjAzMiIsInJvbGUiOiJkcml2ZXIiLCJpYXQiOjE3NjczNzk5MDMsImV4cCI6MTc2OTk3MTkwM30.k6YZMJOMfGO32fjeiVhbPqi_1VjItCX2rkMErsI_aNE

# Note: Use Cloudinary URLs for files
curl -X POST http://localhost:3000/api/driver/auth/update-profile -H "Content-Type: application/json" -H "Authorization: Bearer YOUR_DRIVER_JWT_TOKEN" -d "{
  \"name\": \"Jane Driver\",
  \"email\": \"jane@example.com\",
  \"address\": \"123 Nairobi St\",
  \"idFrontUrl\": \"https://cloudinary.com/id_front.jpg\",
  \"idBackUrl\": \"https://cloudinary.com/id_back.jpg\",
  \"licenseUrl\": \"https://cloudinary.com/license.jpg\",
  \"taxCertUrl\": \"https://cloudinary.com/tax.jpg\",
  \"psvBadgeUrl\": \"https://cloudinary.com/psv.jpg\",
  \"goodConductUrl\": \"https://cloudinary.com/conduct.jpg\",
  \"carMake\": \"Toyota\",
  \"carModel\": \"Fielder\",
  \"carYear\": \"2018\",
  \"carImageUrl\": \"https://cloudinary.com/car.jpg\",
  \"carRegistrationUrl\": \"https://cloudinary.com/reg.jpg\",
  \"profilePhotoUrl\": \"https://cloudinary.com/profile.jpg\",
  \"bankName\": \"KCB\",
  \"accountNumber\": \"1234567890\",
  \"agreementsAccepted\": true
}"

---

## ADMIN AUTHENTICATION

7. Send OTP (Admin)
# Note: Only works if phone is pre-authorized in 'admins' collection
curl -X POST http://localhost:3000/api/admin/auth/send-otp -H "Content-Type: application/json" -d "{\"phone\": \"+254700000001\"}"

8. Verify OTP (Admin)
curl -X POST http://localhost:3000/api/admin/auth/verify-otp -H "Content-Type: application/json" -d "{\"sessionId\": \"YOUR_SESSION_ID\", \"otp\": \"123456\"}"

eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1aWQiOiJhZG1pbl8xNzY3MzY3MjI4ODA4IiwicGhvbmUiOiIyNTQ3NDM0NjYwMzIiLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3Njc0MTcyNDYsImV4cCI6MTc3MDAwOTI0Nn0.3J1sjKJJmB_jDxzQiue-uB4Vgh_f21uYy4wMpBkLLmw

## ADMIN CONTROL (Requires Admin JWT)

9. Verify Driver (Approve/Reject)
curl -X POST http://localhost:3000/api/admin/auth/verify-driver -H "Content-Type: application/json" -H "Authorization: Bearer ADMIN_JWT_TOKEN" -d "{\"uid\": \"DRIVER_UID\", \"status\": \"approved\"}"

10. Disable/Enable Driver
curl -X POST http://localhost:3000/api/admin/auth/toggle-driver-status -H "Content-Type: application/json" -H "Authorization: Bearer ADMIN_JWT_TOKEN" -d "{\"uid\": \"DRIVER_UID\", \"isEnabled\": false}"
---

## CUSTOMER RIDE OPERATIONS

11. Search Location (Geocoding)
curl -X POST http://localhost:3000/api/customer/ride/search-location -H "Content-Type: application/json" -H "Authorization: Bearer YOUR_CUSTOMER_JWT_TOKEN" -d "{\"query\": \"Westlands Nairobi\"}"

12. Get Ride Estimate
curl -X POST http://localhost:3000/api/customer/ride/estimate -H "Content-Type: application/json" -H "Authorization: Bearer YOUR_CUSTOMER_JWT_TOKEN" -d "{
  \"pickup\": { \"lat\": -1.2621, \"lng\": 36.8089, \"address\": \"Westlands\" },
  \"stops\": [{ \"lat\": -1.2833, \"lng\": 36.8167, \"address\": \"Kenyatta Avenue\" }],
  \"dropoff\": { \"lat\": -1.3121, \"lng\": 36.8219, \"address\": \"Upper Hill\" },
  \"rideType\": \"inperson\"
}"

13. Request Ride
curl -X POST http://localhost:3000/api/customer/ride/request -H "Content-Type: application/json" -H "Authorization: Bearer YOUR_CUSTOMER_JWT_TOKEN" -d "{
  \"pickup\": { \"lat\": -1.2621, \"lng\": 36.8089, \"address\": \"Westlands\" },
  \"stops\": [],
  \"dropoff\": { \"lat\": -1.3121, \"lng\": 36.8219, \"address\": \"Upper Hill\" },
  \"rideType\": \"inperson\",
  \"paymentMethod\": \"cash\"
}"

14. Cancel Ride
curl -X POST http://localhost:3000/api/customer/ride/cancel -H "Content-Type: application/json" -H "Authorization: Bearer YOUR_CUSTOMER_JWT_TOKEN" -d "{\"rideId\": \"RIDE_ID\", \"reason\": \"Changed my mind\"}"

---

## DRIVER RIDE OPERATIONS

15. Go Online
curl -X POST http://localhost:3000/api/driver/ride/status/online -H "Content-Type: application/json" -H "Authorization: Bearer YOUR_DRIVER_JWT_TOKEN" -d "{\"location\": {\"lat\": -1.2621, \"lng\": 36.8089}}"

16. Go Offline
curl -X POST http://localhost:3000/api/driver/ride/status/offline -H "Content-Type: application/json" -H "Authorization: Bearer YOUR_DRIVER_JWT_TOKEN"

17. Accept Ride
curl -X POST http://localhost:3000/api/driver/ride/accept -H "Content-Type: application/json" -H "Authorization: Bearer YOUR_DRIVER_JWT_TOKEN" -d "{\"rideId\": \"RIDE_ID\"}"

18. Start Ride
curl -X POST http://localhost:3000/api/driver/ride/start -H "Content-Type: application/json" -H "Authorization: Bearer YOUR_DRIVER_JWT_TOKEN" -d "{\"rideId\": \"RIDE_ID\"}"

19. Complete Ride
curl -X POST http://localhost:3000/api/driver/ride/complete -H "Content-Type: application/json" -H "Authorization: Bearer YOUR_DRIVER_JWT_TOKEN" -d "{\"rideId\": \"RIDE_ID\", \"actualDistanceKm\": 9.8, \"actualDurationMin\": 28}"

20. Rate Customer (Optional)
curl -X POST http://localhost:3000/api/driver/ride/rate-customer -H "Content-Type: application/json" -H "Authorization: Bearer YOUR_DRIVER_JWT_TOKEN" -d "{\"rideId\": \"RIDE_ID\", \"stars\": 5, \"comment\": \"Great passenger!\"}"

21. Get Recent Rides (with earnings)
curl -X GET "http://localhost:3000/api/driver/ride/recent?limit=10" -H "Authorization: Bearer YOUR_DRIVER_JWT_TOKEN"

---

## POST-RIDE OPERATIONS

22. Rate Driver (Customer)
curl -X POST http://localhost:3000/api/customer/ride/rate -H "Content-Type: application/json" -H "Authorization: Bearer YOUR_CUSTOMER_JWT_TOKEN" -d "{\"rideId\": \"RIDE_ID\", \"stars\": 5, \"comment\": \"Excellent driver!\"}"

23. Get Ride History (Customer)
curl -X GET "http://localhost:3000/api/customer/ride/history?limit=10" -H "Authorization: Bearer YOUR_CUSTOMER_JWT_TOKEN"
---

## ADMIN CONFIGURATION & PAYOUTS

24. Get Global Config
curl -X GET http://localhost:3000/api/admin/config -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN"

25. Update Global Config
curl -X POST http://localhost:3000/api/admin/config/update -H "Content-Type: application/json" -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN" -d "{\"commissionRate\": 0.03, \"maxOwedCommission\": 5000}"

26. Get Drivers Owing Commission (Direct-to-Driver)
curl -X GET http://localhost:3000/api/admin/payout/drivers-owing -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN"

27. Get Drivers Owed Payouts (App-Managed)
curl -X GET http://localhost:3000/api/admin/payout/drivers-owed -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN"

28. Get Payout Statistics
curl -X GET http://localhost:3000/api/admin/payout/statistics -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN"

29. Get Revenue Statistics (Date Range)
curl -X GET "http://localhost:3000/api/admin/payout/revenue?startDate=2024-01-01&endDate=2024-12-31" -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN"

---

## ADMIN DRIVER WORKFLOW

30. List Pending Drivers
curl -X GET http://localhost:3000/api/admin/drivers/pending -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN"

31. List All Drivers (with filters)
curl -X GET "http://localhost:3000/api/admin/drivers/all?registrationStatus=approved" -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN"

32. Get Driver Details
curl -X GET http://localhost:3000/api/admin/drivers/DRIVER_ID -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN"

33. Approve Driver
curl -X POST http://localhost:3000/api/admin/drivers/DRIVER_ID/approve -H "Content-Type: application/json" -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN" -d "{\"notes\": \"Documents verified\"}"

34. Reject Driver
curl -X POST http://localhost:3000/api/admin/drivers/DRIVER_ID/reject -H "Content-Type: application/json" -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN" -d "{\"reason\": \"Blurry ID photo\"}"

---

## ADMIN CUSTOMER OPERATIONS

36. List All Customers
curl -X GET http://localhost:3000/api/admin/customers/all?limit=50 -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN"

## ADMIN PROMOTION OPERATIONS

37. Create Promotion
curl -X POST http://localhost:3000/api/admin/promotions/create -H "Content-Type: application/json" -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN" -d "{
  \"code\": \"WELCOME50\",
  \"type\": \"percentage\",
  \"value\": 50,
  \"applicableTo\": \"all\",
  \"validUntil\": \"2024-12-31\",
  \"maxUses\": 100
}"

38. List Promotions
curl -X GET http://localhost:3000/api/admin/promotions/all -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN"

39. Delete Promotion
curl -X DELETE http://localhost:3000/api/admin/promotions/WELCOME50 -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN"

---

## CUSTOMER PROMOTION OPERATIONS

40. Get Available Promotions
curl -X GET http://localhost:3000/api/customer/promo/available -H "Authorization: Bearer YOUR_CUSTOMER_JWT_TOKEN"

41. Apply Promotion (Check Discount)
curl -X POST http://localhost:3000/api/customer/promo/apply -H "Content-Type: application/json" -H "Authorization: Bearer YOUR_CUSTOMER_JWT_TOKEN" -d "{\"promoCode\": \"WELCOME50\", \"fareAmount\": 500}"

---

## REFERRAL & BONUS OPERATIONS

42. Get My Referral Code & Stats
curl -X GET http://localhost:3000/api/user/referral-code -H "Authorization: Bearer YOUR_JWT_TOKEN"

43. Redeem Referral Code (New User)
curl -X POST http://localhost:3000/api/user/redeem -H "Content-Type: application/json" -H "Authorization: Bearer YOUR_JWT_TOKEN" -d "{\"referralCode\": \"REF66032\"}"

44. List Earned Bonuses
curl -X GET http://localhost:3000/api/user/bonuses -H "Authorization: Bearer YOUR_JWT_TOKEN"

---

## VEHICLE CATEGORY OPERATIONS (Admin & Public)

45. List All Vehicle Categories (Admin)
curl -X GET http://localhost:3000/api/admin/vehicle-categories -H "Authorization: Bearer ADMIN_TOKEN"

46. Create Vehicle Category (Admin)
curl -X POST http://localhost:3000/api/admin/vehicle-categories/create -H "Content-Type: application/json" -H "Authorization: Bearer ADMIN_TOKEN" -d "{\"categoryId\": \"motorbike\", \"name\": \"Motorbike\", \"baseFare\": 100, \"perKmRate\": 30, \"perMinRate\": 5, \"maxPassengers\": 1, \"luggageCapacity\": \"Small Parcel\"}"

47. Update Vehicle Category (Admin)
curl -X POST http://localhost:3000/api/admin/vehicle-categories/motorbike/update -H "Content-Type: application/json" -H "Authorization: Bearer ADMIN_TOKEN" -d "{\"baseFare\": 120, \"luggageCapacity\": \"Backpack only\"}"

48. Get Active Categories (Customer)
curl -X GET http://localhost:3000/api/customer/ride/vehicle-categories -H "Authorization: Bearer CUSTOMER_TOKEN"
# Response includes: { categoryId, name, maxPassengers, luggageCapacity, estimatedFare... }

49. Get Available Categories (Driver)
curl -X GET http://localhost:3000/api/driver/ride/available-categories -H "Authorization: Bearer DRIVER_TOKEN"

---

## DRIVER PAYOUT OPERATIONS

35. Get Daily Payout History
curl -X GET "http://localhost:3000/api/driver/payout/daily-history?date=2024-03-20" -H "Authorization: Bearer YOUR_DRIVER_JWT_TOKEN"
