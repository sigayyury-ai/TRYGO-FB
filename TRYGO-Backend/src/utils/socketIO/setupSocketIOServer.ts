import { Server as SocketIOServer, Socket } from 'socket.io';
import { EVENT_NAMES } from '../../constants/socketIO/eventNames';
import { socketContext } from './socketContext';
import { sendErrorToTg } from '../sendErrorToTg';
import authService from '../../services/AuthService';
import { generateProject, GenerateProjectInput } from './generateProject';

import { config } from '../../constants/config/env';
import {
    generateProjectHypothesis,
    GenerateProjectHypothesisInput,
} from './generateProjectHypothesis';
import { createMessage, CreateMessageInput } from './createMessage';
import { safeEmit } from './safeEmit';

// Максимальний розмір повідомлення (1MB)
const MAX_MESSAGE_SIZE = 1024 * 1024;

export const setupSocketIOServer = async (httpServer: any): Promise<void> => {
    try {
        console.log('Setting up socket.io server');

        // Determine CORS origin for Socket.IO
        const corsOrigin = config.isCorsEnabled && config.PRODUCTION_PORTS.length > 0 
            ? config.PRODUCTION_PORTS 
            : '*';
        
        console.log('[Socket.IO] CORS origin:', corsOrigin);
        console.log('[Socket.IO] CORS enabled:', config.isCorsEnabled);
        console.log('[Socket.IO] Production ports:', config.PRODUCTION_PORTS);

        const io = new SocketIOServer(httpServer, {
            cors: {
                origin: corsOrigin,
                credentials: true,
                methods: ['GET', 'POST'],
            },
            allowEIO3: true,
            transports: ['websocket', 'polling'], // Explicitly allow both transports
            maxHttpBufferSize: MAX_MESSAGE_SIZE, // обмеження розміру повідомлень
            pingTimeout: 60000, // час очікування пінгу
            pingInterval: 25000, // інтервал пінгу
            connectTimeout: 45000, // час очікувания з'єднання
            path: '/socket.io/', // Explicit path
        });

        // Middleware для аутентифікації
        io.use(async (socket, next) => {
            try {
                const token = socket.handshake.query.token as string;
                if (!token) {
                    return next(new Error('Authentication error'));
                }

                socket.data.userId = authService.getUserIdFromToken(token);
                next();
            } catch (error) {
                next(new Error('Authentication error'));
            }
        });

        socketContext.setIo(io);

        io.on(EVENT_NAMES.connection, (socket: Socket) => {
            // Log connection only once per socket, not repeatedly
            if (!socket.data.logged) {
                console.log('User connected:', socket.data.userId);
                socket.data.logged = true;
            }
            socketContext.setSocketIdByOwnerUserId(
                socket.data.userId,
                socket.id
            );

            // Handle socket errors to prevent crashes
            socket.on('error', (error) => {
                console.error('[Socket.IO] Socket error:', error);
                // Don't crash - just log the error
            });

            // Handle EPIPE and other write errors
            socket.on('disconnect', (reason) => {
                // Log only non-normal disconnections
                if (reason !== 'transport close' && 
                    reason !== 'client namespace disconnect' && 
                    reason !== 'ping timeout') {
                    console.log('[Socket.IO] Client disconnected:', reason);
                }
            });

            socket.on(
                EVENT_NAMES.generateProject,
                async (input: GenerateProjectInput) => {
                    await generateProject({
                        socket,
                        input,
                        userId: socket.data.userId,
                    });
                }
            );

            socket.on(
                EVENT_NAMES.generateProjectHypothesis,
                async (input: GenerateProjectHypothesisInput) => {
                    await generateProjectHypothesis({
                        socket,
                        input,
                        userId: socket.data.userId,
                    });
                }
            );

            socket.on(EVENT_NAMES.createMessage, async (input: CreateMessageInput) => {
                console.log('[Socket.IO] Получено событие createMessage:', {
                    messageType: input.messageType,
                    projectId: input.projectId,
                    hypothesisId: input.projectHypothesisId,
                    userId: socket.data.userId,
                    messageLength: input.message?.length || 0,
                });
                try {
                    await createMessage({
                        socket,
                        input,
                        userId: socket.data.userId,
                    });
                } catch (error) {
                    console.error('[Socket.IO] Ошибка при обработке createMessage:', error);
                    // Send error to client if socket is still connected
                    safeEmit(socket, 'error', {
                        message: error instanceof Error ? error.message : 'Unknown error',
                        event: 'createMessage',
                    });
                }
            });

            socket.on(EVENT_NAMES.disconnect, async () => {});
        });

        io.on('error', (error) => {
            console.error(error);
            // sendErrorToTg(error as Error);
        });
    } catch (error) {
        console.error(error);
        sendErrorToTg(error as Error);
    }
};
