import { io, Socket } from 'socket.io-client';
import { API_BASE_URL } from '../config/api';

// Construct the root URL from the API URL (e.g., https://.../api -> https://...)
const SOCKET_URL = 'https://fikishwa2-0-backend.onrender.com';

class SocketService {
    private socket: Socket | null = null;
    private userId: string | null = null;

    connect(userId: string) {
        if (this.socket?.connected) return;

        this.userId = userId;
        this.socket = io(SOCKET_URL, {
            query: { userId },
            transports: ['websocket'],
            reconnectionAttempts: 5,
            reconnectionDelay: 2000,
        });

        this.socket.on('connect', () => {
            console.log('Socket connected:', this.socket?.id);
            this.join();
        });

        this.socket.on('connect_error', (error) => {
            console.error('Socket connection error:', error);
        });

        this.socket.on('disconnect', (reason) => {
            console.log('Socket disconnected:', reason);
        });
    }

    private join() {
        if (this.socket && this.userId) {
            this.socket.emit('join', { userId: this.userId, role: 'driver' });
        }
    }

    emit(event: string, data: any) {
        if (this.socket?.connected) {
            this.socket.emit(event, data);
        } else {
            console.warn(`Socket not connected, cannot emit ${event}`);
        }
    }

    on(event: string, callback: (data: any) => void) {
        if (this.socket) {
            this.socket.on(event, callback);
        }
    }

    off(event: string) {
        if (this.socket) {
            this.socket.off(event);
        }
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
    }

    isConnected() {
        return this.socket?.connected || false;
    }
}

export const socketService = new SocketService();
