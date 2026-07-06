# Fikishwa

Fikishwa is a multi-app platform for ride-hailing and delivery services.

## Project Structure

- **backend/**: Node.js/Express API with Socket.IO for real-time driver tracking and M-Pesa payments.
- **FikishwaCustomer/**: React Native (Expo) customer app (JavaScript).
- **FikishwaDriver/**: React Native (Expo) driver app (JavaScript).
- **fikishwa-admin-web/**: Admin Web Dashboard built with Next.js (TypeScript) and Tailwind CSS.
- **fikishwa-web/**: Landing website using plain HTML + CSS + JavaScript (NO React, NO build step). Theme colors defined in `style.css` `:root`.

## Development & Testing

### Testing Interaction (Customer & Driver)

To test the interaction between the Customer and Driver apps (e.g., placing and accepting orders) on a single physical device:

#### Single Device (Split Screen)
You can install both apps on your phone and use the **"Split Screen"** feature to see them both at once. 
1. Open the Customer app.
2. Enter your phone's "Recents" or "Overview" mode.
3. Tap the app icon and select "Split screen".
4. Select the Driver app for the other half of the screen.

This allows you to witness real-time updates across both applications simultaneously.