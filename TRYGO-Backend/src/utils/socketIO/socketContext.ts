import { Server as SocketIOServer } from 'socket.io';

export const socketContext = (() => {
    let io: SocketIOServer | undefined;
    const ownerUserIdFriendUserIdSocketIdMap = new Map<string, string>();

    return {
        getIo(): SocketIOServer {
            if (!io) throw new Error('Socket.io is not initialized');

            return io;
        },

        setIo(socketIo: SocketIOServer): void {
            io = socketIo;
        },

        getSocketIdByOwnerUserId(ownerUserId: string): string | undefined {
            return ownerUserIdFriendUserIdSocketIdMap.get(ownerUserId);
        },

        setSocketIdByOwnerUserId(ownerUserId: string, socketId: string): void {
            ownerUserIdFriendUserIdSocketIdMap.set(ownerUserId, socketId);
        },
    };
})();
