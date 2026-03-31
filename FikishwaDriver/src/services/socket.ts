import { io, Socket } from 'socket.io-client';
import { API_BASE_URL } from './api';

class SocketService {
    private socket: Socket | null = null;

    connect(userId: string, role: 'driver' | 'customer', location?: any) {
        if (this.socket?.connected) return;

        this.socket = io(API_BASE_URL, {
            transports: ['websocket'],
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
        });

        this.socket.on('connect', () => {
            console.log('✅ Connected to socket server:', this.socket?.id);
            this.socket?.emit('join', { userId, role, location });
        });

        this.socket.on('disconnect', () => {
            console.log('❌ Disconnected from socket server');
        });

        this.socket.on('connect_error', (error) => {
            console.error('Socket connection error:', error);
        });
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
    }

    on(event: string, callback: (data: any) => void) {
        this.socket?.on(event, callback);
    }

    off(event: string) {
        this.socket?.off(event);
    }

    emit(event: string, data: any) {
        this.socket?.emit(event, data);
    }

    getSocket() {
        return this.socket;
    }
}

const socketService = new SocketService();
export default socketService;
