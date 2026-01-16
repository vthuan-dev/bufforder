import { Socket, io } from "socket.io-client";

// ⚡ Global admin socket - shared across all admin components
let globalAdminSocket: Socket | null = null;

export function getAdminSocket(): Socket | null {
    return globalAdminSocket;
}

export function initAdminSocket(token: string): Socket {
    if (globalAdminSocket?.connected) {
        return globalAdminSocket;
    }

    if (globalAdminSocket) {
        globalAdminSocket.disconnect();
        globalAdminSocket = null;
    }

    const API_BASE = (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_API_BASE_URL) || 'http://localhost:5000';
    globalAdminSocket = io(API_BASE, {
        auth: { adminToken: token },
        reconnection: true,
        reconnectionAttempts: 3,
        reconnectionDelay: 1000
    });

    // Auto-join admins room when connected
    globalAdminSocket.on('connect', () => {
        console.log('[adminSocket] Connected to server, joining admins room');
        globalAdminSocket?.emit('admin:join');
    });

    return globalAdminSocket;
}

export function disconnectAdminSocket(): void {
    if (globalAdminSocket) {
        globalAdminSocket.disconnect();
        globalAdminSocket = null;
    }
}
