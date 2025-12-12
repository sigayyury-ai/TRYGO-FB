import { Socket } from 'socket.io';

/**
 * Safely emit an event to a socket, handling EPIPE and other write errors
 * @param socket - Socket.IO socket instance
 * @param event - Event name
 * @param data - Data to emit
 * @returns true if emit was successful, false otherwise
 */
export const safeEmit = (socket: Socket | null, event: string, data: any): boolean => {
    if (!socket) {
        console.warn(`[safeEmit] Socket is null, cannot emit event: ${event}`);
        return false;
    }

    if (!socket.connected) {
        console.warn(`[safeEmit] Socket is not connected, cannot emit event: ${event}`);
        return false;
    }

    try {
        socket.emit(event, data);
        return true;
    } catch (error: any) {
        // Handle EPIPE and other write errors gracefully
        if (error.code === 'EPIPE' || error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT') {
            console.warn(`[safeEmit] Socket write error (${error.code}) for event ${event}:`, error.message);
            return false;
        }
        
        // Log other errors but don't crash
        console.error(`[safeEmit] Error emitting event ${event}:`, error);
        return false;
    }
};
