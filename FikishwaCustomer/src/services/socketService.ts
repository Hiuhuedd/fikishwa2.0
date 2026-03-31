import { io, Socket } from 'socket.io-client';
import { API_BASE_URL } from '../config/api';

class SocketService {
    private socket: Socket | null = null;
    private userId: string | null = null;
    private pendingListeners: Map<string, (data: any) => void> = new Map();

    connect(userId: string, location?: any) {
        this.userId = userId;

        // If already connected, just re-emit join (in case of role re-registration)
        if (this.socket?.connected) {
            this.socket.emit('join', { userId, role: 'customer', location });
            return;
        }

        // Disconnect stale socket
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }

        console.log('[SocketService] Connecting to:', API_BASE_URL);
        this.socket = io(API_BASE_URL, {
            query: { userId },
            transports: ['polling', 'websocket'],
            reconnectionAttempts: 5,
            reconnectionDelay: 2000,
            timeout: 10000,
        });

        // Re-attach any pending listeners
        for (const [event, callback] of this.pendingListeners.entries()) {
            this.socket.on(event, callback);
        }

        this.socket.on('connect', () => {
            console.log('[SocketService] Connected! Socket ID:', this.socket?.id);
            this.socket?.emit('join', { userId, role: 'customer', location });
        });

        this.socket.on('connect_error', (err) => {
            console.error('[SocketService] Connection error:', err.message);
        });

        this.socket.on('disconnect', (reason) => {
            console.log('[SocketService] Disconnected:', reason);
        });
    }

    on(event: string, callback: (data: any) => void) {
        // Store for re-attachment after reconnect
        this.pendingListeners.set(event, callback);
        // Attach now if socket exists
        if (this.socket) {
            this.socket.off(event); // Prevent duplicate listeners
            this.socket.on(event, callback);
        }
    }

    off(event: string) {
        this.pendingListeners.delete(event);
        this.socket?.off(event);
    }

    emit(event: string, data: any) {
        if (this.socket?.connected) {
            this.socket.emit(event, data);
        } else {
            console.warn('[SocketService] Cannot emit - not connected:', event);
        }
    }

    disconnect() {
        this.pendingListeners.clear();
        this.socket?.disconnect();
        this.socket = null;
    }

    isConnected() {
        return this.socket?.connected || false;
    }
}

export const socketService = new SocketService();
