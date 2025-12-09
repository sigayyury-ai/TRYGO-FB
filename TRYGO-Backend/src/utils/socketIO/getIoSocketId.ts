import { Server } from 'socket.io';
import { socketContext } from './socketContext';

export const getIoSocketId = (
    ownerUserId: string
): { io: Server; socketId: string } | undefined => {
    try {
        const socketId = socketContext.getSocketIdByOwnerUserId(ownerUserId);

        if (!socketId) {
            console.log(
                `socketId not found for ownerUserId: ${ownerUserId}`
            );

            return;
        }
        const io = socketContext.getIo();

        if (!io.sockets.sockets.get(socketId)) {
            console.warn(`Socket with id ${socketId} not found.`);

            return;
        }

        return { io, socketId };
    } catch (error) {
        console.error(error);
        return;
    }
};
