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

// Максимальний розмір повідомлення (1MB)
const MAX_MESSAGE_SIZE = 1024 * 1024;

export const setupSocketIOServer = async (httpServer: any): Promise<void> => {
    try {
        console.log('Setting up socket.io server');

        const io = new SocketIOServer(httpServer, {
            cors: {
                origin: config.isCorsEnabled ? config.PRODUCTION_PORTS : '*',
                credentials: true,
            },
            allowEIO3: true,
            maxHttpBufferSize: MAX_MESSAGE_SIZE, // обмеження розміру повідомлень
            pingTimeout: 60000, // час очікування пінгу
            pingInterval: 25000, // інтервал пінгу
            connectTimeout: 45000, // час очікування з'єднання
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
