/**
 * Socket.io Configuration
 * 
 * Real-time communication configuration for ride requests and updates
 */

import { SOCKET_URL } from '@env';

export const SOCKET_CONFIG = {
    url: SOCKET_URL,
    options: {
        transports: ['websocket'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 5,
        autoConnect: false, // We'll connect manually after authentication
    },
};

export const SOCKET_EVENTS = {
    // Incoming events (listen)
    RIDE_REQUEST: 'ride:request',
    RIDE_CANCELLED: 'ride:cancelled',
    REGISTRATION_STATUS_UPDATED: 'registration:status_updated',
    EARNINGS_UPDATED: 'earnings:updated',

    // Outgoing events (emit)
    DRIVER_LOCATION_UPDATE: 'driver:location_update',
};
